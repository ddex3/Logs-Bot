const { EmbedBuilder, AuditLogEvent } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')

  const db = new sqlite3.Database(dbPath)

  client.on('guildUpdate', async (oldGuild, newGuild) => {
    if (oldGuild.afkChannelId === newGuild.afkChannelId) return

    const oldChannel = oldGuild.afkChannelId
      ? `<#${oldGuild.afkChannelId}> (${newGuild.channels.cache.get(oldGuild.afkChannelId)?.name || 'Unknown'})`
      : 'None'

    const newChannel = newGuild.afkChannelId
      ? `<#${newGuild.afkChannelId}> (${newGuild.channels.cache.get(newGuild.afkChannelId)?.name || 'Unknown'})`
      : 'None'

    const logs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate, limit: 1 })
    const entry = logs.entries.find(e => e.changes?.some(c => c.key === 'afk_channel_id'))
    const executor = entry?.executor
      ? `<@${entry.executor.id}> (${entry.executor.tag})`
      : 'Unknown'

    const timestamp = Math.floor(Date.now() / 1000)

    db.get(
      'SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = ?',
      [newGuild.id, 'AFK Channel Changed'],
      async (err, row) => {
        if (err || !row) return
        const logChannel = newGuild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('AFK Channel Changed')
          .addFields(
            { name: 'Before', value: oldChannel, inline: true },
            { name: 'After', value: newChannel, inline: true },
            { name: 'Changed By', value: executor, inline: false },
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
