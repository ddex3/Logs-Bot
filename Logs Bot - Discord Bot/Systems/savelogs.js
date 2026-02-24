const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const dataDir = path.join(process.cwd(), 'Data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
const userLogsDbPath = path.join(dataDir, 'userLogs.db')
const db = new sqlite3.Database(userLogsDbPath)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS server_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    log_type TEXT NOT NULL,
    log_title TEXT NOT NULL,
    log_color INTEGER,
    log_fields TEXT NOT NULL,
    log_thumbnail TEXT,
    log_footer TEXT,
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`) 
})
function saveServerLog(guildId, logType, logTitle, logColor, logFields, channelId, messageId, logThumbnail, logFooter) {
  if (!guildId || !logType || !logTitle || !Array.isArray(logFields) || !channelId || !messageId) return
  const nowIso = new Date().toISOString()
  db.run(
    'INSERT INTO server_logs (guild_id, log_type, log_title, log_color, log_fields, log_thumbnail, log_footer, channel_id, message_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [guildId, logType, logTitle, logColor || 0, JSON.stringify(logFields), logThumbnail || null, logFooter || null, channelId, messageId, nowIso],
    err => { if (err) console.error('saveServerLog error:', err) }
  )
}
module.exports = (client) => {
}
module.exports.saveServerLog = saveServerLog