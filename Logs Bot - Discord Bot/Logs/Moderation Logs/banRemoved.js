const { EmbedBuilder, AuditLogEvent } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const db = new sqlite3.Database(path.join(dataDir, 'logsChannels.db'))

  client.on('guildBanRemove', async ban => {
    const guild = ban.guild
    const user = ban.user
    const timestamp = Math.floor(Date.now() / 1000)

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 }).catch(() => null)
    const entry = logs?.entries.find(e => e.target.id === user.id && Date.now() - e.createdTimestamp < 5000)
    const executor = entry?.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : 'Unknown'

    db.get("SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Ban Removed'",
      [guild.id],
      (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Ban Removed')
          .addFields(
            { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
            { name: 'ID', value: user.id, inline: true },
            { name: 'Unbanned By', value: executor, inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#67e68d')
          .setThumbnail(user.displayAvatarURL())
          .setFooter({ text: `${guild.client.user.username} • Ban Removed`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
            { name: 'ID', value: user.id, inline: true },
            { name: 'Unbanned By', value: executor, inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'moderation', 'Ban Removed', 0x67e68d, fields, row.channel_id, sent.id, user.displayAvatarURL(), `${guild.client.user.username} • Ban Removed`)
        }).catch(() => {})
      }
    )
  })
}
