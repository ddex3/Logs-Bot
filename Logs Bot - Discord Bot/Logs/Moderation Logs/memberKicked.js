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

  client.on('guildMemberRemove', async member => {
    const guild = member.guild
    const timestamp = Math.floor(Date.now() / 1000)
    const auditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 }).catch(() => null)
    const kickEntry = auditLogs?.entries.find(e => e.target.id === member.id && Date.now() - e.createdTimestamp < 5000)

    if (!kickEntry) return

    const executor = kickEntry.executor
      ? `<@${kickEntry.executor.id}> (${kickEntry.executor.tag})`
      : 'Unknown'

    const createdAt = member.user.createdAt
    const joinedAt = member.joinedAt
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
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Member Kicked'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Member Kicked')
          .addFields(
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Kicked By', value: executor, inline: true },
            { name: 'Joined Server', value: joinedAt ? `<t:${Math.floor(joinedAt.getTime() / 1000)}> (<t:${Math.floor(joinedAt.getTime() / 1000)}:R>)` : 'Unknown', inline: true },
            { name: 'Kicked At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f25252')
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: `${guild.client.user.username} • Member Kicked`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Kicked By', value: executor, inline: true },
            { name: 'Joined Server', value: joinedAt ? `<t:${Math.floor(joinedAt.getTime() / 1000)}> (<t:${Math.floor(joinedAt.getTime() / 1000)}:R>)` : 'Unknown', inline: true },
            { name: 'Kicked At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'moderation', 'Member Kicked', 0xf25252, fields, row.channel_id, sent.id, member.user.displayAvatarURL(), `${guild.client.user.username} • Member Kicked`)
        }).catch(() => {})
      }
    )
  })
}
