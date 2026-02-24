const { EmbedBuilder, AuditLogEvent } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const db = new sqlite3.Database(path.join(dataDir, 'logsChannels.db'))

  client.on('guildMemberAdd', async member => {
    const guild = member.guild
    if (!member.user.bot) return

    const timestamp = Math.floor(Date.now() / 1000)
    const createdAt = member.user.createdAt
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
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Bot Added to Server'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return
      
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 1 }).catch(() => null)
        const entry = logs?.entries.find(e => e.target.id === member.id)
        const addedBy = entry?.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : 'Unknown'
      
        const embed = new EmbedBuilder()
          .setTitle('New Bot Joined')
          .addFields(
            { name: 'Bot', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Bot Age', value: ageText, inline: false },
            { name: 'Created At', value: `<t:${Math.floor(createdAt.getTime() / 1000)}> (<t:${Math.floor(createdAt.getTime() / 1000)}:R>)`, inline: true },
            { 
              name: 'Verified', 
              value: (member.user.flags?.has?.('VerifiedBot') || member.user.flags?.has?.(1 << 16)) ? 'Yes' : 'No', 
              inline: true 
            },
            { name: 'Permissions', value: member.permissions.toArray().join(', ') || 'None', inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false },
            { name: 'Added By', value: addedBy, inline: true }
          )
          .setColor('#67e68d')
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: `${guild.client.user.username} • Bot Added`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()
        
        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Bot', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Bot Age', value: ageText, inline: false },
            { name: 'Created At', value: `<t:${Math.floor(createdAt.getTime() / 1000)}> (<t:${Math.floor(createdAt.getTime() / 1000)}:R>)`, inline: true },
            { name: 'Verified', value: (member.user.flags?.has?.('VerifiedBot') || member.user.flags?.has?.(1 << 16)) ? 'Yes' : 'No', inline: true },
            { name: 'Permissions', value: member.permissions.toArray().join(', ') || 'None', inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false },
            { name: 'Added By', value: addedBy, inline: true }
          ]
          saveServerLog(guild.id, 'moderation', 'Bot Added', 0x67e68d, fields, row.channel_id, sent.id, member.user.displayAvatarURL(), `${guild.client.user.username} • Bot Added`)
        }).catch(() => {})
      }
    )
  })
}
