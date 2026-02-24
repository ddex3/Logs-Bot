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

  client.on('threadDelete', async thread => {
    if (!thread.guild) return
    const guild = thread.guild

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Thread Deleted'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const parent = thread.parent ? `${thread.parent.name} (<#${thread.parentId}>)` : `<#${thread.parentId}>`
        const timestamp = Math.floor(Date.now() / 1000)

        let deletedBy = 'Unknown'
        try {
          const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ThreadDelete, limit: 5 })
          const entry = logs.entries.find(e => e.target?.id === thread.id)
          if (entry?.executor) {
            deletedBy = `<@${entry.executor.id}> (${entry.executor.tag})`
          }
        } catch {}

        const embed = new EmbedBuilder()
          .setTitle('Thread Deleted')
          .addFields(
            { name: 'Name', value: thread.name, inline: true },
            { name: 'Type', value: typeNames[thread.type] || 'Unknown', inline: true },
            { name: 'Parent Channel', value: parent, inline: false },
            { name: 'Deleted By', value: deletedBy, inline: false },
            { name: 'Thread ID', value: thread.id, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f25252')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: guild.name, iconURL: guild.iconURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).catch(() => {})
      }
    )
  })
}
