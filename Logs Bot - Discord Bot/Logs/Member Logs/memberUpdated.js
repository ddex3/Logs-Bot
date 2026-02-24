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
    const timestamp = Math.floor(Date.now() / 1000)
    const user = newMember.user
    const changes = []

    const logs = await guild.fetchAuditLogs({ limit: 1 }).catch(() => null)
    const entry = logs?.entries.first()
    const executor = entry?.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : 'Unknown'

    const oldNick = oldMember.nickname || 'None'
    const newNick = newMember.nickname || 'None'
    if (oldNick !== newNick) {
      changes.push({ name: 'Nickname (Before)', value: oldNick, inline: true })
      changes.push({ name: 'Nickname (After)', value: newNick, inline: true })
    }

    const oldRoles = oldMember.roles.cache.map(r => r.id)
    const newRoles = newMember.roles.cache.map(r => r.id)

    const addedRoles = newRoles.filter(r => !oldRoles.includes(r))
    const removedRoles = oldRoles.filter(r => !newRoles.includes(r))

    if (addedRoles.length > 0)
      changes.push({ name: 'Roles Added', value: addedRoles.map(r => `<@&${r}>`).join(', '), inline: false })

    if (removedRoles.length > 0)
      changes.push({ name: 'Roles Removed', value: removedRoles.map(r => `<@&${r}>`).join(', '), inline: false })

    if (changes.length === 0) return

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
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Member Updated'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Member Updated')
          .addFields(
            { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
            { name: 'ID', value: user.id, inline: true },
            { name: 'Updated By', value: executor, inline: true },
            ...changes,
            { name: 'Updated At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f2c852')
          .setThumbnail(user.displayAvatarURL())
          .setFooter({ text: `${guild.client.user.username} • Member Updated`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
            { name: 'ID', value: user.id, inline: true },
            { name: 'Updated By', value: executor, inline: true },
            ...changes,
            { name: 'Updated At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'member', 'Member Updated', 0xf2c852, fields, row.channel_id, sent.id, user.displayAvatarURL(), `${guild.client.user.username} • Member Updated`)
        }).catch(() => {})
      }
    )
  })
}
