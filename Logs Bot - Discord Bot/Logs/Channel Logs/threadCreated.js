const { EmbedBuilder, ChannelType, AuditLogEvent } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')

  const db = new sqlite3.Database(dbPath)

  const typeNames = {
    [ChannelType.PublicThread]: 'Public',
    [ChannelType.PrivateThread]: 'Private',
    [ChannelType.AnnouncementThread]: 'Announcement',
    [ChannelType.GuildNewsThread]: 'Announcement'
  }

  client.on('threadCreate', async thread => {
    if (!thread.guild) return
    const guild = thread.guild

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Thread Created'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const timestamp = Math.floor(Date.now() / 1000)

        let createdBy = 'Unknown'
        try {
          const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ThreadCreate, limit: 5 })
          const entry = logs.entries.find(e => e.target?.id === thread.id)
          if (entry?.executor) {
            createdBy = `<@${entry.executor.id}> (${entry.executor.tag})`
          }
        } catch {}

        const parentChannel = thread.parent
          ? `<#${thread.parentId}> (${thread.parent.name})`
          : 'Unknown'

        const embed = new EmbedBuilder()
          .setTitle('Thread Created')
          .addFields(
            { name: 'Name', value: `${thread.name}`, inline: true },
            { name: 'Type', value: typeNames[thread.type] || 'Unknown', inline: true },
            { name: 'Parent Channel', value: parentChannel, inline: false },
            { name: 'Created By', value: createdBy, inline: false },
            { name: 'Thread ID', value: thread.id, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#67e68d')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: guild.name, iconURL: guild.iconURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).catch(() => {})
      }
    )
  })
}
