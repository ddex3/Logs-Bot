const DAB = import.meta.env.VITE_DISCORD_API_BASE_URL || 'https://discord.com/api/v10';
const BAB = import.meta.env.VITE_API_BASE_URL || 'https://api.logsbot.com/api';
interface DG { id: string; name: string; icon: string | null; owner: boolean; permissions: string; features: string[]; approximate_member_count?: number; approximate_presence_count?: number; }
interface DC { id: string; name: string; type: number; position: number; parent_id?: string; }
interface BGI { id: string; name: string; icon: string | null; member_count: number; presence_count: number; channels: DC[]; bot_permissions: string; joined_at?: string; }
interface LS { [logType: string]: string; }
class DAS {
  private ut: string | null = null;
  private bgc: Map<string, BGI> = new Map();
  private ce: number = 0;
  private readonly CD = 30 * 1000;
  sut(token: string) { this.ut = token; }
  async gug(): Promise<DG[]> {
    if (!this.ut) return [];
    try {
      const response = await fetch(`${DAB}/users/@me/guilds`, { headers: { 'Authorization': `Bearer ${this.ut}` } });
      if (!response.ok) return [];
      const guilds = await response.json();
      return guilds;
    } catch (error) { return []; }
  }
  async gabg(): Promise<Map<string, BGI>> {
    if (Date.now() < this.ce && this.bgc.size > 0) return this.bgc;
    this.bgc.clear();
    const maxRetries = 3;
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(`${BAB}/bot/guilds`, { method: 'GET', headers: { 'Cache-Control': 'no-cache' }, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) return new Map();
        const botGuilds = await response.json();
        if (!botGuilds || botGuilds.length === 0) { this.ce = Date.now() + this.CD; return this.bgc; }
        const guildPromises = botGuilds.map(async (guild: any) => {
          try {
            const guildController = new AbortController();
            const guildTimeoutId = setTimeout(() => guildController.abort(), 5000);
            const guildResponse = await fetch(`${BAB}/bot/guilds/${guild.id}`, { method: 'GET', headers: { 'Cache-Control': 'no-cache' }, signal: guildController.signal });
            clearTimeout(guildTimeoutId);
            if (!guildResponse.ok) return null;
            const guildData = await guildResponse.json();
            const botGuildInfo: BGI = { id: guildData.id, name: guildData.name, icon: guildData.icon, member_count: guildData.approximate_member_count || 0, presence_count: guildData.approximate_presence_count || 0, channels: [], bot_permissions: '8', joined_at: guildData.joined_at || undefined };
            return { id: guild.id, info: botGuildInfo };
          } catch (error) { return null; }
        });
        const results = await Promise.allSettled(guildPromises);
        for (const result of results) { if (result.status === 'fulfilled' && result.value) { this.bgc.set(result.value.id, result.value.info); } }
        this.ce = Date.now() + this.CD;
        return this.bgc;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return new Map();
  }
  async gbgi(guildId: string): Promise<BGI | null> {
    const allBotGuilds = await this.gabg();
    const guildInfo = allBotGuilds.get(guildId);
    return guildInfo || null;
  }
  async gbgsi(guildIds: string[]): Promise<Map<string, BGI>> {
    const allBotGuilds = await this.gabg();
    const results = new Map<string, BGI>();
    for (const guildId of guildIds) {
      const guildInfo = allBotGuilds.get(guildId);
      if (guildInfo) results.set(guildId, guildInfo);
    }
    return results;
  }
  async ggd(guildId: string): Promise<BGI | null> {
    const response = await fetch(`${BAB}/bot/guilds/${guildId}`);
    if (!response.ok) return null;
    const guildData = await response.json();
    return { id: guildData.id, name: guildData.name, icon: guildData.icon, member_count: guildData.approximate_member_count || 0, presence_count: guildData.approximate_presence_count || 0, channels: [], bot_permissions: '8', joined_at: guildData.joined_at || undefined };
  }
  async ggc(guildId: string): Promise<DC[]> {
    try {
      const response = await fetch(`${BAB}/bot/guilds/${guildId}/channels`);
      if (!response.ok) return [];
      const channels = await response.json();
      return channels;
    } catch (error) { return []; }
  }
  async gls(guildId: string): Promise<LS> {
    try {
      const response = await fetch(`${BAB}/bot/guilds/${guildId}/logs`);
      if (!response.ok) return {};
      const settings = await response.json();
      return settings;
    } catch (error) { return {}; }
  }
  async uls(guildId: string, logType: string, channelId: string, userId?: string, username?: string, userAvatar?: string, actionType?: string): Promise<boolean> {
    try {
      const response = await fetch(`${BAB}/bot/guilds/${guildId}/logs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logType, channelId, userId, username, userAvatar, actionType }) });
      if (!response.ok) return false;
      return true;
    } catch (error) { return false; }
  }
  async rls(guildId: string, logType: string, userId?: string, username?: string, userAvatar?: string): Promise<boolean> {
    try {
      const response = await fetch(`${BAB}/bot/guilds/${guildId}/logs/${encodeURIComponent(logType)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, username, userAvatar }) });
      if (!response.ok) return false;
      return true;
    } catch (error) { return false; }
  }
  async stl(guildId: string, channelId: string): Promise<{ success: boolean; message: string; channelName?: string }> {
    try {
      
      const response = await fetch(`${BAB}/bot/test-log`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ guildId, channelId }) 
      });
      
      
      const responseText = await response.text();
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { error: responseText || 'Failed to parse response' };
      }
      
      if (!response.ok) {
        console.error('[API] Request failed:', data);
        return { success: false, message: data.message || data.error || `Failed to send test log (${response.status})` };
      }
      
      return { success: true, message: data.message, channelName: data.channelName };
    } catch (error) {
      console.error('[API] Error sending test log:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }
  async gul(guildId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const response = await fetch(`${BAB}/bot/guilds/${guildId}/user-logs?limit=${limit}&offset=${offset}`);
      if (!response.ok) return [];
      const logs = await response.json();
      return logs;
    } catch (error) { return []; }
  }
  async gsl(guildId: string, logType: string = 'message', limit: number = 50): Promise<{ success: boolean; logs: any[]; logType?: string; message?: string }> {
    try {
      const response = await fetch(`${BAB}/bot/guilds/${guildId}/server-logs?logType=${logType}&limit=${limit}`);
      if (!response.ok) return { success: false, logs: [], message: 'Failed to fetch server logs' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, logs: [], message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async gdlc(guildId: string): Promise<{ success: boolean; dailyLogsCount: number; date?: string; message?: string }> {
    try {
      const response = await fetch(`${BAB}/bot/guilds/${guildId}/daily-logs-count`);
      if (!response.ok) return { success: false, dailyLogsCount: 0, message: 'Failed to fetch daily logs count' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, dailyLogsCount: 0, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async getServerStats(guildId: string, timeRange: string = '30d'): Promise<{ success: boolean; stats?: any; message?: string }> {
    try {
      const response = await fetch(`${BAB}/stats/${guildId}?timeRange=${timeRange}`);
      if (!response.ok) return { success: false, message: 'Failed to fetch server stats' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async getActivityData(guildId: string, period: string = 'daily'): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const response = await fetch(`${BAB}/stats/${guildId}/activity?period=${period}`);
      if (!response.ok) return { success: false, message: 'Failed to fetch activity data' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async getLogsByType(guildId: string, timeRange: string = '30d'): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const response = await fetch(`${BAB}/stats/${guildId}/logs-by-type?timeRange=${timeRange}`);
      if (!response.ok) return { success: false, message: 'Failed to fetch logs by type' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async getRealtimeStats(guildId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${BAB}/stats/${guildId}/realtime`);
      if (!response.ok) return { success: false, message: 'Failed to fetch real-time stats' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async getPresenceStats(guildId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await fetch(`${BAB}/stats/${guildId}/presence`);
      if (!response.ok) return { success: false, message: 'Failed to fetch presence stats' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async getDetailedPresence(guildId: string, limit: number = 50, offset: number = 0, status: string = 'all'): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const response = await fetch(`${BAB}/stats/${guildId}/presence/detailed?limit=${limit}&offset=${offset}&status=${status}`);
      if (!response.ok) return { success: false, message: 'Failed to fetch detailed presence data' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async getPresenceHistory(guildId: string): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const response = await fetch(`${BAB}/stats/${guildId}/presence/history`);
      if (!response.ok) return { success: false, message: 'Failed to fetch presence history' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async getVoiceTimeData(guildId: string): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const response = await fetch(`${BAB}/stats/${guildId}/voice-time`);
      if (!response.ok) return { success: false, message: 'Failed to fetch voice time data' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async getMostActiveUsers(guildId: string, limit: number = 5): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
      const response = await fetch(`${BAB}/stats/${guildId}/most-active-users?limit=${limit}`);
      if (!response.ok) return { success: false, message: 'Failed to fetch most active users' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async gbs(): Promise<'online' | 'offline' | 'maintenance'> { return 'online'; }
  async exportLogs(guildId: string, format: 'json' | 'csv' | 'pdf', dateRange: string, logTypes: string[], includeSettings: boolean, includeAuditLog: boolean): Promise<{ success: boolean; data?: any; mimeType?: string; filename?: string; message?: string }> {
    try {
      const logTypesParam = logTypes.length > 0 ? logTypes.join(',') : 'all';
      const response = await fetch(`${BAB}/export/${guildId}?format=${format}&dateRange=${dateRange}&logTypes=${logTypesParam}&includeSettings=${includeSettings}&includeAuditLog=${includeAuditLog}`);
      if (!response.ok) return { success: false, message: 'Failed to export logs' };
      
      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        return { 
          success: true, 
          data: blob, 
          mimeType: 'application/json',
          filename: `logs-export-${guildId}-${new Date().toISOString().split('T')[0]}.json`
        };
      } else if (format === 'csv') {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv' });
        return { 
          success: true, 
          data: blob, 
          mimeType: 'text/csv',
          filename: `logs-export-${guildId}-${new Date().toISOString().split('T')[0]}.csv`
        };
      } else {
        const data = await response.json();
        if (!data.success) {
          return { success: false, message: data.message || 'PDF export not available' };
        }
        return { success: false, message: 'PDF export is not yet implemented' };
      }
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async backupSettings(guildId: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<{ success: boolean; data?: any; filename?: string; message?: string }> {
    try {
      const response = await fetch(`${BAB}/export/backup/${guildId}?format=${format}`);
      if (!response.ok) return { success: false, message: 'Failed to backup settings' };
      
      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        return { 
          success: true, 
          data: blob,
          filename: `settings-backup-${guildId}-${new Date().toISOString().split('T')[0]}.json`
        };
      } else if (format === 'csv') {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv' });
        return { 
          success: true, 
          data: blob,
          filename: `settings-backup-${guildId}-${new Date().toISOString().split('T')[0]}.csv`
        };
      } else {
        return { success: false, message: 'PDF format is not yet implemented' };
      }
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async backupAuditLog(guildId: string, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<{ success: boolean; data?: any; filename?: string; message?: string }> {
    try {
      const response = await fetch(`${BAB}/export/backup/audit-log/${guildId}?format=${format}`);
      if (!response.ok) return { success: false, message: 'Failed to backup audit log' };
      
      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        return { 
          success: true, 
          data: blob,
          filename: `audit-log-backup-${guildId}-${new Date().toISOString().split('T')[0]}.json`
        };
      } else if (format === 'csv') {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv' });
        return { 
          success: true, 
          data: blob,
          filename: `audit-log-backup-${guildId}-${new Date().toISOString().split('T')[0]}.csv`
        };
      } else {
        return { success: false, message: 'PDF format is not yet implemented' };
      }
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async saveBackupSchedule(guildId: string, schedule: { enabled: boolean; frequency: string; time: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${BAB}/export/schedule/${guildId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
      });
      if (!response.ok) return { success: false, message: 'Failed to save backup schedule' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async getBackupSchedule(guildId: string): Promise<{ success: boolean; schedule?: any; message?: string }> {
    try {
      const response = await fetch(`${BAB}/export/schedule/${guildId}`);
      if (!response.ok) return { success: false, message: 'Failed to fetch backup schedule' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  async getTranscripts(guildId: string, channelId?: string, limit: number = 50, offset: number = 0): Promise<{ success: boolean; transcripts?: any[]; count?: number; message?: string }> {
    try {
      let url = `${BAB}/dashboard/transcripts?limit=${limit}&offset=${offset}`;
      if (guildId) url += `&guild_id=${guildId}`;
      if (channelId) url += `&channel_id=${channelId}`;
      const response = await fetch(url);
      if (!response.ok) return { success: false, message: 'Failed to fetch transcripts' };
      const data = await response.json();
      return data;
    } catch (error) { 
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error occurred' }; 
    }
  }
  cc() { this.bgc.clear(); this.ce = 0; }
}
export const da = new DAS();

export const discordApi = {
  setUserToken: da.sut.bind(da),
  clearCache: da.cc.bind(da),
  getUserGuilds: da.gug.bind(da),
  getAllBotGuilds: da.gabg.bind(da),
  getGuildDetails: da.ggd.bind(da),
  getGuildChannels: da.ggc.bind(da),
  getLogSettings: da.gls.bind(da),
  updateLogSetting: da.uls.bind(da),
  removeLogSetting: da.rls.bind(da),
  sendTestLog: da.stl.bind(da),
  getUserLogs: da.gul.bind(da),
  getServerLogs: da.gsl.bind(da),
  getDailyLogsCount: da.gdlc.bind(da),
  getServerStats: da.getServerStats.bind(da),
  getActivityData: da.getActivityData.bind(da),
  getLogsByType: da.getLogsByType.bind(da),
  getRealtimeStats: da.getRealtimeStats.bind(da),
  getPresenceStats: da.getPresenceStats.bind(da),
  getDetailedPresence: da.getDetailedPresence.bind(da),
  getPresenceHistory: da.getPresenceHistory.bind(da),
  getVoiceTimeData: da.getVoiceTimeData.bind(da),
  getMostActiveUsers: da.getMostActiveUsers.bind(da),
  getBotStatus: da.gbs.bind(da),
  exportLogs: da.exportLogs.bind(da),
  backupSettings: da.backupSettings.bind(da),
  backupAuditLog: da.backupAuditLog.bind(da),
  saveBackupSchedule: da.saveBackupSchedule.bind(da),
  getBackupSchedule: da.getBackupSchedule.bind(da),
  getTranscripts: da.getTranscripts.bind(da),
};
export type {
  DG as DiscordGuild,
  DC as DiscordChannel,
  BGI as BotGuildInfo,
  LS as LogSettings,
};