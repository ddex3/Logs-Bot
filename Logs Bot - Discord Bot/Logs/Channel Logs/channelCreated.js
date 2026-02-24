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

  client.on('channelCreate', async channel => {
    if (!channel.guild) return
    const guild = channel.guild

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Channel Created'",
      [guild.id],
      async (err, row) => {
        if (err) {
          console.error('Database error (Channel Created):', err)
          return
        }
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        try {
          const auditLogs = await guild.fetchAuditLogs({
            type: AuditLogEvent.ChannelCreate,
            limit: 1
          })

          const entry = auditLogs.entries.first()
          const executor = entry?.executor
            ? `<@${entry.executor.id}> (${entry.executor.tag})`
            : 'Unknown'

          const timestamp = Math.floor(Date.now() / 1000)

          const embed = new EmbedBuilder()
            .setTitle('Channel Created')
            .addFields(
              { name: 'Name', value: `<#${channel.id}> (${channel.name})`, inline: true },
              { name: 'Type', value: typeNames[channel.type] || 'Unknown', inline: true },
              { name: 'Channel ID', value: channel.id, inline: false },
              { name: 'Created By', value: executor, inline: false },
              { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
            )
            .setColor('#67e68d')
            .setThumbnail(guild.iconURL())
            .setFooter({ text: guild.name, iconURL: guild.iconURL() })
            .setTimestamp()

          await logChannel.send({ embeds: [embed] })
        } catch (e) {
          console.error('Failed to send Channel Created log:', e)
          const errorEmbed = new EmbedBuilder()
            .setTitle('Logs Bot Error')
            .setDescription(`\`\`\`${e.message}\`\`\``)
            .setColor('#67e68d')
            .setTimestamp()
          logChannel.send({ embeds: [errorEmbed] }).catch(() => {})
        }
      }
    )
  })
}
