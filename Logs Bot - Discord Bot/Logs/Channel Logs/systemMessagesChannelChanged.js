const { EmbedBuilder, AuditLogEvent } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')

  const db = new sqlite3.Database(dbPath)
  
  client.on('guildUpdate', async (oldGuild, newGuild) => {
    if (oldGuild.systemChannelId === newGuild.systemChannelId) return

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'System Messages Channel Changed'",
      [newGuild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = newGuild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const oldChannel = oldGuild.systemChannelId
          ? `<#${oldGuild.systemChannelId}> (${newGuild.channels.cache.get(oldGuild.systemChannelId)?.name || 'Unknown'})`
          : 'None'

        const newChannel = newGuild.systemChannelId
          ? `<#${newGuild.systemChannelId}> (${newGuild.channels.cache.get(newGuild.systemChannelId)?.name || 'Unknown'})`
          : 'None'

        const timestamp = Math.floor(Date.now() / 1000)

        let changedBy = 'Unknown'
        try {
          const logs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 5 })
          const entry = logs.entries.find(e =>
            e.changes?.some(c => c.key === 'system_channel_id') &&
            e.target?.id === newGuild.id
          )
          if (entry?.executor) {
            changedBy = `<@${entry.executor.id}> (${entry.executor.tag})`
          }
        } catch {}

        const embed = new EmbedBuilder()
          .setTitle('System Messages Channel Changed')
          .addFields(
            { name: 'Before', value: oldChannel, inline: true },
            { name: 'After', value: newChannel, inline: true },
            { name: 'Changed By', value: changedBy, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f2c852')
          .setThumbnail(newGuild.iconURL())
          .setFooter({ text: newGuild.name, iconURL: newGuild.iconURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).catch(() => {})
      }
    )
  })
}
