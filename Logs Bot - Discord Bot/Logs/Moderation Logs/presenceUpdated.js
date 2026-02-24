const { EmbedBuilder } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')
  const db = new sqlite3.Database(dbPath)

  client.on('presenceUpdate', (oldPresence, newPresence) => {
    if (!oldPresence || !newPresence || !newPresence.guild) return
    if (oldPresence.status === newPresence.status) return

    const guild = newPresence.guild
    const member = newPresence.member
    const timestamp = Math.floor(Date.now() / 1000)
    const statusMap = {
      online: '<:offline:1457767179708661915> Online',
      idle: '<:idle:1457767250542202983> Idle',
      dnd: '<:dnd:1457767213980188704> Do Not Disturb',
      offline: '<:online:1457767230224994480> Offline'
    }
    const oldStatus = statusMap[oldPresence.status] || oldPresence.status
    const newStatus = statusMap[newPresence.status] || newPresence.status

    db.get("SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Presence Updated'", [guild.id], async (_, row) => {
      if (!row) return
      const logChannel = guild.channels.cache.get(row.channel_id)
      if (!logChannel) return

      const embed = new EmbedBuilder()
        .setTitle('Presence Updated')
        .addFields(
          { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
          { name: 'ID', value: member.id, inline: true },
          { name: 'Old Status', value: oldStatus, inline: true },
          { name: 'New Status', value: newStatus, inline: true },
          { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
        )
        .setColor('#f2c852')
        .setFooter({ text: `${guild.client.user.username} • Presence Updated`, iconURL: guild.client.user.displayAvatarURL() })
        .setThumbnail(member.displayAvatarURL())
        .setTimestamp()

      logChannel.send({ embeds: [embed] }).then(sent => {
        const fields = [
          { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
          { name: 'ID', value: member.id, inline: true },
          { name: 'Old Status', value: oldStatus, inline: true },
          { name: 'New Status', value: newStatus, inline: true },
          { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
        ]
        saveServerLog(guild.id, 'moderation', 'Presence Updated', 0xf2c852, fields, row.channel_id, sent.id, member.displayAvatarURL(), `${guild.client.user.username} • Presence Updated`)
      }).catch(() => {})
    })
  })
}
