const { EmbedBuilder, AuditLogEvent } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')
  const db = new sqlite3.Database(dbPath)

  client.on('guildBanAdd', async ban => {
    const guild = ban.guild
    const user = ban.user
    const timestamp = Math.floor(Date.now() / 1000)

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => null)
    const entry = logs?.entries.find(e => e.target.id === user.id && Date.now() - e.createdTimestamp < 5000)
    const executor = entry?.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : 'Unknown'
    const reason = entry?.reason || 'No reason provided'

    const createdAt = user.createdAt
    const now = new Date()
    let years = now.getFullYear() - createdAt.getFullYear()
    let months = now.getMonth() - createdAt.getMonth()
    let days = now.getDate() - createdAt.getDate()
    if (days < 0) {
      months -= 1
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate()
    }
    if (months < 0) {
      years -= 1
      months += 12
    }
    const ageText = `**${years}** years, **${months}** months, **${days}** days`

    db.get("SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Member Banned'", [guild.id], async (_, row) => {
      if (!row) return
      const logChannel = guild.channels.cache.get(row.channel_id)
      if (!logChannel) return

      const embed = new EmbedBuilder()
        .setTitle('Member Banned')
        .addFields(
          { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
          { name: 'ID', value: user.id, inline: true },
          { name: 'Banned By', value: executor, inline: true },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Account Age', value: ageText, inline: false },
          { name: 'Banned At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
        )
        .setColor('#f25252')
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: `${guild.client.user.username} • Member Banned`, iconURL: guild.client.user.displayAvatarURL() })
        .setTimestamp()

      logChannel.send({ embeds: [embed] }).then(sent => {
        const fields = [
          { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
          { name: 'ID', value: user.id, inline: true },
          { name: 'Banned By', value: executor, inline: true },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Account Age', value: ageText, inline: false },
          { name: 'Banned At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
        ]
        saveServerLog(guild.id, 'moderation', 'Member Banned', 0xf25252, fields, row.channel_id, sent.id, user.displayAvatarURL(), `${guild.client.user.username} • Member Banned`)
      }).catch(() => {})
    })
  })
}
