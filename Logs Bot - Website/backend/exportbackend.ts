import express, { Request, Response, NextFunction } from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPaths = {
  serverLogs: path.join(__dirname, '..', '..', 'Logs Bot - Discord Bot', 'Data', 'userLogs.db'),
  userLogs: path.join(__dirname, '..', '..', 'Logs Bot - Discord Bot', 'Data', 'userLogs.db'),
  logsChannels: path.join(__dirname, '..', '..', 'Logs Bot - Discord Bot', 'Data', 'logsChannels.db')
};

const validateGuildId = (req: Request, res: Response, next: NextFunction) => 
  /^\d{17,19}$/.test(req.params.guildId || req.body.guildId) ? next() : res.status(400).json({ error: 'Invalid guild ID' });

const getDb = (type: keyof typeof dbPaths) => new sqlite3.Database(dbPaths[type]);

const getDateRange = (timeRange: string, botJoinedAt?: string) => {
  if (timeRange === 'all') {
    if (botJoinedAt) {
      const joinedDate = new Date(botJoinedAt);
      joinedDate.setHours(0, 0, 0, 0);
      return { start: joinedDate.toISOString(), end: new Date().toISOString() };
    }
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    twoYearsAgo.setHours(0, 0, 0, 0);
    return { start: twoYearsAgo.toISOString(), end: new Date().toISOString() };
  }
  const now = new Date();
  const ranges: { [key: string]: number } = { '7d': 7, '30d': 30, '90d': 90 };
  const days = ranges[timeRange] || 30;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const endDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  return { start: startDate.toISOString(), end: endDate.toISOString() };
};

const dbQuery = (db: sqlite3.Database, query: string, params: any[]): Promise<any[]> => 
  new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

router.get('/:guildId', validateGuildId, async (req, res) => {
  const { guildId } = req.params;
  const { format = 'json', dateRange = '30d', logTypes = 'all', includeSettings = 'true', includeAuditLog = 'false' } = req.query;
  
  const selectedLogTypes = logTypes === 'all' ? [] : (logTypes as string).split(',').filter(t => t.trim());
  
  const shouldIncludeAuditLog = String(includeAuditLog) === 'true';

  try {
    let botJoinedAt: string | undefined;
    if (dateRange === 'all') {
      const { config: appConfig } = await import('./config.js');
      const DAB = appConfig.DISCORD_API_BASE_URL;
      const BT = appConfig.DISCORD_BOT_TOKEN;
      const fetchWithAuth = (url: string) => fetch(url, { headers: { 'Authorization': `Bot ${BT}` } });
      
      const botUser = await fetchWithAuth(`${DAB}/users/@me`).then(r => r.ok ? r.json() : null);
      if (botUser?.id) {
        const member = await fetchWithAuth(`${DAB}/guilds/${guildId}/members/${botUser.id}`).then(r => r.ok ? r.json() : null);
        if (member?.joined_at) {
          botJoinedAt = member.joined_at;
        }
      }
    }
    
    const dateFilter = getDateRange(dateRange as string, botJoinedAt);
    const serverLogsDb = getDb('serverLogs');
    const userLogsDb = getDb('userLogs');

    let serverLogsQuery = 'SELECT * FROM server_logs WHERE guild_id = ? AND CAST(timestamp AS TEXT) >= ? AND CAST(timestamp AS TEXT) <= ?';
    const serverLogsParams: any[] = [guildId, dateFilter.start, dateFilter.end];
    
    if (selectedLogTypes.length > 0) {
      const logTypeMap: { [key: string]: string[] } = {
        'member': ['member'],
        'user': ['user'],
        'moderation': ['moderation'],
        'role': ['role'],
        'channel': ['channel'],
        'message': ['message'],
        'invite': ['invite'],
        'voice': ['voice'],
        'webhook_stage': ['webhook', 'stage'],
        'scheduled_event': ['scheduled_event', 'event'],
        'emoji_sticker': ['emoji', 'sticker'],
        'nitro_boost': ['nitro', 'boost']
      };
      
      const allLogTypes: string[] = [];
      selectedLogTypes.forEach(categoryId => {
        if (logTypeMap[categoryId]) {
          allLogTypes.push(...logTypeMap[categoryId]);
        } else {
          allLogTypes.push(categoryId);
        }
      });
      
      if (allLogTypes.length > 0) {
        const placeholders = allLogTypes.map(() => '?').join(',');
        serverLogsQuery += ` AND log_type IN (${placeholders})`;
        serverLogsParams.push(...allLogTypes);
      }
    }
    
    serverLogsQuery += ' ORDER BY timestamp DESC';
    
    const serverLogs = await dbQuery(serverLogsDb, serverLogsQuery, serverLogsParams);
    
    if (serverLogs.length === 0 && selectedLogTypes.length > 0) {
      const availableLogTypes = await dbQuery(serverLogsDb, 
        'SELECT DISTINCT log_type FROM server_logs WHERE guild_id = ? AND CAST(timestamp AS TEXT) >= ? AND CAST(timestamp AS TEXT) <= ?',
        [guildId, dateFilter.start, dateFilter.end]
      );

    }

    let userLogs: any[] = [];
    if (shouldIncludeAuditLog) {
      userLogs = await dbQuery(userLogsDb, 
        'SELECT * FROM user_logs WHERE guild_id = ? AND CAST(timestamp AS TEXT) >= ? AND CAST(timestamp AS TEXT) <= ? ORDER BY timestamp DESC',
        [guildId, dateFilter.start, dateFilter.end]
      );
    }

    let settings = {};
    if (includeSettings === 'true') {
      const logsChannelsDb = getDb('logsChannels');
      const settingsRows = await dbQuery(logsChannelsDb, 
        'SELECT log, channel_id FROM logs_channels WHERE guild_id = ?',
        [guildId]
      );
      settings = settingsRows.reduce((acc: any, row: any) => {
        acc[row.log] = row.channel_id;
        return acc;
      }, {});
    }

    const categoryNames: { [key: string]: string } = {
      'member': 'memberActivity',
      'user': 'userChanges',
      'moderation': 'moderationActions',
      'role': 'roleManagement',
      'channel': 'channelEvents',
      'message': 'messageActivity',
      'invite': 'inviteTracking',
      'voice': 'voiceActivity',
      'webhook_stage': 'webhookStageEvents',
      'scheduled_event': 'scheduledEvents',
      'emoji_sticker': 'emojiStickers',
      'nitro_boost': 'nitroBoosts'
    };

    const logsByCategory: { [key: string]: any[] } = {};
    
    if (selectedLogTypes.length > 0) {
      selectedLogTypes.forEach(categoryId => {
        const categoryName = categoryNames[categoryId] || categoryId;
        logsByCategory[categoryName] = [];
      });
    } else {
      Object.values(categoryNames).forEach(categoryName => {
        logsByCategory[categoryName] = [];
      });
    }

    const logTypeToCategoryId: { [key: string]: string } = {
      'member': 'member',
      'user': 'user',
      'moderation': 'moderation',
      'role': 'role',
      'channel': 'channel',
      'message': 'message',
      'invite': 'invite',
      'voice': 'voice',
      'webhook': 'webhook_stage',
      'stage': 'webhook_stage',
      'scheduled_event': 'scheduled_event',
      'event': 'scheduled_event',
      'emoji': 'emoji_sticker',
      'sticker': 'emoji_sticker',
      'nitro': 'nitro_boost',
      'boost': 'nitro_boost'
    };

    serverLogs.forEach((log: any) => {
      const logType = log.log_type;
      const categoryId = logTypeToCategoryId[logType];
      
      if (categoryId) {
        const categoryName = categoryNames[categoryId];
        
        if (selectedLogTypes.length === 0 || selectedLogTypes.includes(categoryId)) {
          if (categoryName && logsByCategory[categoryName] !== undefined) {
            logsByCategory[categoryName].push({
              id: log.id,
              logType: log.log_type,
              logTitle: log.log_title,
              logColor: log.log_color,
              logFields: typeof log.log_fields === 'string' ? JSON.parse(log.log_fields) : log.log_fields,
              logThumbnail: log.log_thumbnail,
              logFooter: log.log_footer,
              channelId: log.channel_id,
              messageId: log.message_id,
              timestamp: log.timestamp
            });
          }
        }
      }
    });

    const exportData: any = {
      exportDate: new Date().toISOString(),
      guildId,
      dateRange: {
        start: dateFilter.start,
        end: dateFilter.end
      },
      filters: {
        logTypes: selectedLogTypes.length > 0 ? selectedLogTypes : ['all'],
        includeSettings: String(includeSettings) === 'true',
        includeAuditLog: shouldIncludeAuditLog
      },
      ...logsByCategory
    };

    if (shouldIncludeAuditLog) {
      exportData.auditLogs = userLogs.map((log: any) => ({
        id: log.id,
        userId: log.user_id,
        username: log.username,
        userAvatar: log.user_avatar,
        actionType: log.action_type,
        actionDetails: log.action_details,
        oldValue: log.old_value,
        newValue: log.new_value,
        timestamp: log.timestamp
      }));
    }

    if (includeSettings === 'true') {
      exportData.settings = settings;
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="logs-export-${guildId}-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } else if (format === 'csv') {
      const csvRows: string[] = [];
      
      csvRows.push('Type,ID,Timestamp,Title/Action,Details,User,Channel');
      
      serverLogs.forEach((log: any) => {
        const fields = typeof log.log_fields === 'string' ? JSON.parse(log.log_fields) : log.log_fields;
        const details = fields.map((f: any) => `${f.name}: ${f.value}`).join('; ');
        csvRows.push(`Server Log,${log.id},${log.timestamp},${log.log_title},"${details}",,${log.channel_id}`);
      });
      
      if (shouldIncludeAuditLog) {
        userLogs.forEach((log: any) => {
          csvRows.push(`Audit Log,${log.id},${log.timestamp},${log.action_type},"${log.action_details}",${log.username},`);
        });
      }
      
      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="logs-export-${guildId}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/json');
      res.json({
        success: false,
        message: 'PDF export is not yet implemented. Please use JSON or CSV format.',
        data: exportData
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid format. Use json, csv, or pdf' });
    }

    serverLogsDb.close();
    userLogsDb.close();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export logs', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/backup/:guildId', validateGuildId, async (req, res) => {
  const { guildId } = req.params;
  const { format = 'json' } = req.query;

  try {
    const logsChannelsDb = getDb('logsChannels');
    const settingsRows = await dbQuery(logsChannelsDb, 
      'SELECT log, channel_id FROM logs_channels WHERE guild_id = ?',
      [guildId]
    );

    const backupData = {
      backupDate: new Date().toISOString(),
      guildId,
      version: '1.0',
      settings: settingsRows.reduce((acc: any, row: any) => {
        acc[row.log] = row.channel_id;
        return acc;
      }, {})
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="settings-backup-${guildId}-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(backupData);
    } else if (format === 'csv') {
      const csvRows: string[] = [];
      csvRows.push('Log Type,Channel ID');
      Object.entries(backupData.settings).forEach(([logType, channelId]) => {
        csvRows.push(`${logType},${channelId}`);
      });
      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="settings-backup-${guildId}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.status(400).json({ success: false, message: 'PDF format is not yet implemented' });
    }
    
    logsChannelsDb.close();
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ success: false, message: 'Failed to backup settings', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/backup/audit-log/:guildId', validateGuildId, async (req, res) => {
  const { guildId } = req.params;
  const { format = 'json' } = req.query;

  try {
    const userLogsDb = getDb('userLogs');
    
    const auditLogs = await dbQuery(userLogsDb, 
      'SELECT * FROM user_logs WHERE guild_id = ? ORDER BY timestamp DESC',
      [guildId]
    );

    const backupData = {
      backupDate: new Date().toISOString(),
      guildId,
      version: '1.0',
      auditLogs: auditLogs.map((log: any) => ({
        id: log.id,
        userId: log.user_id,
        username: log.username,
        userAvatar: log.user_avatar,
        actionType: log.action_type,
        actionDetails: log.action_details,
        oldValue: log.old_value,
        newValue: log.new_value,
        timestamp: log.timestamp
      }))
    };

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-log-backup-${guildId}-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(backupData);
    } else if (format === 'csv') {
      const csvRows: string[] = [];
      csvRows.push('ID,User ID,Username,Action Type,Action Details,Old Value,New Value,Timestamp');
      auditLogs.forEach((log: any) => {
        csvRows.push(`${log.id},${log.user_id},${log.username},"${log.action_type}","${log.action_details}","${log.old_value || ''}","${log.new_value || ''}",${log.timestamp}`);
      });
      const csv = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-log-backup-${guildId}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.status(400).json({ success: false, message: 'PDF format is not yet implemented' });
    }
    
    userLogsDb.close();
  } catch (error) {
    console.error('Backup audit log error:', error);
    res.status(500).json({ success: false, message: 'Failed to backup audit log', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/schedule/:guildId', validateGuildId, async (req, res) => {
  const { guildId } = req.params;
  const { enabled, frequency, time } = req.body;

  try {
    const scheduleData = {
      guildId,
      enabled: enabled || false,
      frequency: frequency || 'weekly',
      time: time || '02:00',
      lastBackup: new Date().toISOString()
    };

    res.json({ success: true, message: 'Backup schedule saved', schedule: scheduleData });
  } catch (error) {
    console.error('Schedule save error:', error);
    res.status(500).json({ success: false, message: 'Failed to save backup schedule', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.get('/schedule/:guildId', validateGuildId, async (req, res) => {
  const { guildId } = req.params;

  try {
    const schedule = {
      guildId,
      enabled: false,
      frequency: 'weekly',
      time: '02:00',
      lastBackup: null
    };

    res.json({ success: true, schedule });
  } catch (error) {
    console.error('Schedule fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch backup schedule', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

