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
    [ChannelType.GuildText]: 'Text',
    [ChannelType.GuildVoice]: 'Voice',
    [ChannelType.GuildCategory]: 'Category',
    [ChannelType.GuildForum]: 'Forum',
    [ChannelType.GuildStageVoice]: 'Stage'
  }

  client.on('channelDelete', async channel => {
    if (!channel.guild) return
    const guild = channel.guild

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Channel Deleted'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        let deletedBy = 'Unknown'

        try {
          const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 })
          const entry = logs.entries.find(e => e.target?.id === channel.id)
          if (entry?.executor) {
            deletedBy = `<@${entry.executor.id}> (${entry.executor.tag})`
          }
        } catch {}

        const timestamp = Math.floor(Date.now() / 1000)

        const embed = new EmbedBuilder()
          .setTitle('Channel Deleted')
          .addFields(
            { name: 'Name', value: `${channel.name}`, inline: true },
            { name: 'Type', value: typeNames[channel.type] || 'Unknown', inline: true },
            { name: 'Channel ID', value: channel.id, inline: false },
            { name: 'Deleted By', value: deletedBy, inline: false },
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
