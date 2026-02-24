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

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const guild = newMember.guild
    if (oldMember.nickname === newMember.nickname) return

    const timestamp = Math.floor(Date.now() / 1000)
    const user = newMember.user

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 1 }).catch(() => null)
    const entry = logs?.entries.find(e => e.target.id === user.id && e.changes.some(c => c.key === 'nick'))
    const executor = entry?.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : 'Unknown'

    const oldNick = oldMember.nickname || 'None'
    const newNick = newMember.nickname || 'None'

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

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Nickname Changed'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Nickname Changed')
          .addFields(
            { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
            { name: 'ID', value: user.id, inline: true },
            { name: 'Changed By', value: executor, inline: true },
            { name: 'Before', value: oldNick, inline: true },
            { name: 'After', value: newNick, inline: true },
            { name: 'Changed At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f2c852')
          .setThumbnail(user.displayAvatarURL())
          .setFooter({ text: `${guild.client.user.username} • Nickname Changed`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
            { name: 'ID', value: user.id, inline: true },
            { name: 'Changed By', value: executor, inline: true },
            { name: 'Before', value: oldNick, inline: true },
            { name: 'After', value: newNick, inline: true },
            { name: 'Changed At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'member', 'Nickname Changed', 0xf2c852, fields, row.channel_id, sent.id, user.displayAvatarURL(), `${guild.client.user.username} • Nickname Changed`)
        }).catch(() => {})
      }
    )
  })
}
