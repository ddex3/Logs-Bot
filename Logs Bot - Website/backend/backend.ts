
import express, { Request, Response, NextFunction } from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import statsRouter from './statsbackend.js';
import exportRouter from './exportbackend.js';
import transcriptsRouter from './transcriptsbackend.js';

const router = express.Router();
const DAB = config.DISCORD_API_BASE_URL;
const BT = config.DISCORD_BOT_TOKEN;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'Logs Bot - Discord Bot', 'Data', 'logsChannels.db');
const userLogsDbPath = path.join(__dirname, '..', '..', 'Logs Bot - Discord Bot', 'Data', 'userLogs.db');

let cachedBotId: string | null = null;
const TLA = new Map<string, { count: number, lastAttempt: number }>();

const vgl = (req: Request, res: Response, next: NextFunction) => {
  const guildId = req.params.guildId || req.body.guildId;
  if (!guildId || !/^\d{17,19}$/.test(guildId)) {
    return res.status(400).json({ error: 'Invalid guild ID' });
  }
  next();
};

const vdl = (req: Request, res: Response, next: NextFunction) => {
  const channelId = req.params.channelId || req.body.channelId;
  if (!channelId || !/^\d{17,19}$/.test(channelId)) {
    return res.status(400).json({ error: 'Invalid channel ID' });
  }
  next();
};

const getBotId = async (): Promise<string> => 
  cachedBotId || (cachedBotId = await fetch(`${DAB}/users/@me`, { headers: { 'Authorization': `Bot ${BT}` } })
    .then(r => r.ok ? r.json() : null).then(u => u?.id || '').catch(() => ''));

const getDb = () => new sqlite3.Database(dbPath);
const getUserLogsDb = () => {
  const db = new sqlite3.Database(userLogsDbPath);
  db.run(`CREATE TABLE IF NOT EXISTS user_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, user_id TEXT NOT NULL, username TEXT NOT NULL, user_avatar TEXT, action_type TEXT NOT NULL, action_details TEXT NOT NULL, old_value TEXT, new_value TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  return db;
};

const getServerLogsDb = () => {
  const db = new sqlite3.Database(userLogsDbPath);
  db.serialize(() => db.run(`CREATE TABLE IF NOT EXISTS server_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, log_type TEXT NOT NULL, log_title TEXT NOT NULL, log_color INTEGER, log_fields TEXT NOT NULL, log_thumbnail TEXT, log_footer TEXT, channel_id TEXT NOT NULL, message_id TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`));
  return db;
};

const logUserAction = (guildId: string, userId: string, username: string, actionType: string, AD: string, oldValue?: string, newValue?: string, userAvatar?: string) => {
  const db = getUserLogsDb();
  db.run('INSERT INTO user_logs (guild_id, user_id, username, user_avatar, action_type, action_details, old_value, new_value, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
    [guildId, userId, username, userAvatar || null, actionType, AD, oldValue || null, newValue || null, new Date().toISOString()]);
};

const logServerAction = (guildId: string, logType: string, logTitle: string, logColor: number, logFields: any[], channelId: string, messageId: string, logThumbnail?: string, logFooter?: string) => {
  const db = getServerLogsDb();
  db.run('INSERT INTO server_logs (guild_id, log_type, log_title, log_color, log_fields, log_thumbnail, log_footer, channel_id, message_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
    [guildId, logType, logTitle, logColor, JSON.stringify(logFields), logThumbnail || null, logFooter || null, channelId, messageId, new Date().toISOString()]);
};

const fetchWithAuth = (url: string) => fetch(url, { headers: { 'Authorization': `Bot ${BT}` } });
const handleDb = (db: sqlite3.Database, query: string, params: any[], callback: (err: any, rows?: any) => void) => 
  db.all(query, params, callback);

router.get('/bot/guilds', async (req, res) => 
  fetchWithAuth(`${DAB}/users/@me/guilds`).then(r => r.ok ? r.json() : null).then(g => g && res.json(g)));

router.get('/bot/guilds/:guildId', vgl, async (req, res) => {
  const { guildId } = req.params;
  const [guild, botId] = await Promise.all([
    fetchWithAuth(`${DAB}/guilds/${guildId}?with_counts=true`).then(r => r.ok ? r.json() : null),
    getBotId()
  ]);
  if (guild && botId) {
    const member = await fetchWithAuth(`${DAB}/guilds/${guildId}/members/${botId}`).then(r => r.ok ? r.json() : null);
    if (member) guild.joined_at = member.joined_at;
    res.json(guild);
  }
});

router.get('/bot/guilds/:guildId/channels', vgl, async (req, res) => 
  fetchWithAuth(`${DAB}/guilds/${req.params.guildId}/channels`)
    .then(r => r.ok ? r.json() : null)
    .then(c => c && res.json(c.filter((ch: any) => [0, 5].includes(ch.type)))));

router.get('/bot/guilds/:guildId/logs', vgl, (req, res) => 
  handleDb(getDb(), 'SELECT log, channel_id FROM logs_channels WHERE guild_id = ?', [req.params.guildId], 
    (err, rows) => !err && res.json(rows?.reduce((acc: any, r: any) => ({ ...acc, [r.log]: r.channel_id }), {}))));

router.post('/bot/guilds/:guildId/logs', vgl, (req, res) => {
  const { guildId } = req.params;
  const { logType, channelId, userId, username, userAvatar, actionType } = req.body;
  if (!logType || !channelId) return;
  
  const db = getDb();
  db.get('SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = ?', [guildId, logType], (err, row: any) => {
    const oldChannelId = row?.channel_id;
    db.run('INSERT OR REPLACE INTO logs_channels (guild_id, log, channel_id) VALUES (?, ?, ?)', [guildId, logType, channelId], () => {
      if (userId && username) {
        const actions = {
          'channel_change': ['LOG_CHANNEL_CHANGED', `Changed ${logType} log channel`],
          'update': ['LOG_UPDATED', `Updated ${logType} log`],
          'enable': ['LOG_ENABLED', `Enabled ${logType} log`]
        };
        let [LAT, AD] = actions[actionType] || [null, null];
        if (!LAT) {
          const isDisabled = !oldChannelId || 
                            oldChannelId === '' || 
                            oldChannelId === 'Disabled' || 
                            oldChannelId === 'Unknown' ||
                            String(oldChannelId).trim() === '';
          
          if (isDisabled) {
            [LAT, AD] = actions['enable'];
          } else if (oldChannelId !== channelId) {
            [LAT, AD] = actions['channel_change'];
          } else {
            [LAT, AD] = actions['update'];
          }
        }
        logUserAction(guildId, userId, username, LAT, AD, oldChannelId || 'Disabled', channelId, userAvatar);
      }
      res.json({ success: true, message: `Log ${logType} updated for channel ${channelId}` });
    });
  });
});

router.delete('/bot/guilds/:guildId/logs/:logType', vgl, (req, res) => {
  const { guildId, logType } = req.params;
  const { userId, username, userAvatar } = req.body;
  const db = getDb();
  db.get('SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = ?', [guildId, logType], (err, row: any) => {
    const oldChannelId = row?.channel_id;
    db.run('DELETE FROM logs_channels WHERE guild_id = ? AND log = ?', [guildId, logType], () => {
      if (userId && username) logUserAction(guildId, userId, username, 'LOG_DISABLED', `Disabled ${logType} log`, oldChannelId || 'Unknown', 'Disabled', userAvatar);
      res.json({ success: true, message: `Log ${logType} removed` });
    });
  });
});

router.get('/bot/guilds/:guildId/user-logs', vgl, (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  handleDb(getUserLogsDb(), 'SELECT * FROM user_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?', 
    [req.params.guildId, parseInt(limit as string), parseInt(offset as string)], 
    (err, rows) => !err && res.json(rows?.map((r: any) => ({ ...r, old_value: r.old_value?.replace('Channel: ', '') || r.old_value, new_value: r.new_value?.replace('Channel: ', '') || r.new_value }))));
});

router.post('/bot/test-log', vgl, vdl, async (req, res) => {

  const { guildId, channelId } = req.body;
  
  if (!guildId || !channelId) {
    console.error('[Backend] Missing guildId or channelId');
    return res.status(400).json({ success: false, error: 'Missing guildId or channelId' });
  }
  
  if (!BT) {
    console.error('DISCORD_BOT_TOKEN is not set');
    return res.status(500).json({ success: false, error: 'Bot token not configured' });
  }
  
  try {
    
    const now = new Date();
    const createdAt = new Date(now.getTime() - (1000 * 60 * 60 * 24 * 365 * 2 + 1000 * 60 * 60 * 24 * 40 + 1000 * 60 * 60 * 24 * 12));
    const [years, months, days] = [now.getFullYear() - createdAt.getFullYear(), now.getMonth() - createdAt.getMonth(), now.getDate() - createdAt.getDate()];
    const ageText = `**${years}** years, **${months}** months, **${days}** days`;
    
    const testEmbed = {
      title: 'Member Joined', 
      color: 0x67e68d,
      fields: [
        { name: 'User', value: '<@123456789012345678> (TestUser#0001)', inline: true },
        { name: 'ID', value: '123456789012345678', inline: true },
        { name: 'Invite Code', value: 'test123', inline: true },
        { name: 'Account Age', value: ageText, inline: false },
        { name: 'Created At', value: `<t:${Math.floor(createdAt.getTime() / 1000)}>`, inline: true },
        { name: 'Time', value: `<t:${Math.floor(now.getTime() / 1000)}> (<t:${Math.floor(now.getTime() / 1000)}:R>)`, inline: false }
      ],
      thumbnail: { url: 'https://cdn.discordapp.com/embed/avatars/0.png' },
      footer: { text: 'Logs Bot • Test Member Joined', icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png' },
      timestamp: now.toISOString()
    };
    
    const channelResponse = await fetchWithAuth(`${DAB}/channels/${channelId}`);
    const channelData = channelResponse.ok ? await channelResponse.json() : null;
    const channelName = channelData?.name || 'channel';
    
    const response = await fetch(`${DAB}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${BT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [testEmbed]
      })
    });
    
    const responseText = await response.text();

    
    if (response.ok) {
      res.json({ success: true, message: 'Test log sent successfully', channelName });
    } else {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText || 'Unknown error' };
      }
      console.error(`[Test Log] Failed to send:`, errorData);
      res.status(response.status).json({ 
        success: false, 
        message: errorData.message || `Failed to send test log (${response.status})`,
        error: errorData 
      });
    }
  } catch (error) {
    console.error('[Test Log] Error sending test log:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Internal server error while sending test log' 
    });
  }
});

router.get('/bot/guilds/:guildId/server-logs', vgl, (req, res) => {
  const { limit = 50, logType = 'message' } = req.query;
  const query = logType === 'all' ? 'SELECT * FROM server_logs WHERE guild_id = ? ORDER BY timestamp DESC LIMIT ?' : 'SELECT * FROM server_logs WHERE guild_id = ? AND log_type = ? ORDER BY timestamp DESC LIMIT ?';
  const params = logType === 'all' ? [req.params.guildId, parseInt(limit as string)] : [req.params.guildId, logType, parseInt(limit as string)];
  
  handleDb(getServerLogsDb(), query, params, (err, rows) => 
    !err && res.json({ success: true, logs: rows?.map((r: any) => ({ id: r.message_id, channelId: r.channel_id, timestamp: r.timestamp, logType: r.log_type, embed: { title: r.log_title, color: r.log_color, fields: JSON.parse(r.log_fields), thumbnail: r.log_thumbnail ? { url: r.log_thumbnail } : undefined, footer: r.log_footer ? { text: r.log_footer } : undefined } })), logType }));
});

router.post('/bot/guilds/:guildId/save-log', vgl, (req, res) => {
  const { guildId } = req.params;
  const { logType, logTitle, logColor, logFields, logThumbnail, logFooter, channelId, messageId } = req.body;
  if (!logType || !logTitle || !logFields || !channelId || !messageId) return res.status(400).json({ error: 'Missing required fields' });
  
  logServerAction(guildId, logType, logTitle, logColor || 0x000000, logFields, channelId, messageId, logThumbnail, logFooter);
  res.json({ success: true, message: 'Log saved successfully' });
});

router.get('/bot/guilds/:guildId/daily-logs-count', vgl, (req, res) => {
  const today = new Date();
  const [startOfDay, endOfDay] = [new Date(today.getFullYear(), today.getMonth(), today.getDate()), new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)];
  
  handleDb(getServerLogsDb(), 'SELECT COUNT(*) as count FROM server_logs WHERE guild_id = ? AND timestamp >= ? AND timestamp < ?', 
    [req.params.guildId, startOfDay.toISOString(), endOfDay.toISOString()], 
    (err, row: any) => !err && res.json({ success: true, dailyLogsCount: row.count || 0, date: today.toISOString().split('T')[0] }));
});

router.use('/stats', statsRouter);
router.use('/export', exportRouter);
router.use('/dashboard', transcriptsRouter);

export default router; 