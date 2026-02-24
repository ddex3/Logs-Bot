const { EmbedBuilder, AuditLogEvent } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')

  const db = new sqlite3.Database(dbPath)

  client.on('userUpdate', async (oldUser, newUser) => {
    if (oldUser.username === newUser.username) return

    const timestamp = Math.floor(Date.now() / 1000)

    for (const guild of client.guilds.cache.values()) {
      const member = guild.members.cache.get(newUser.id)
      if (!member) continue

      db.get(
        "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Username Changed'",
        [guild.id],
        async (_, row) => {
          if (!row) return
          const logChannel = guild.channels.cache.get(row.channel_id)
          if (!logChannel) return

          const embed = new EmbedBuilder()
            .setTitle('Username Changed')
            .addFields(
              { name: 'User', value: `<@${newUser.id}> (${newUser.tag})`, inline: false },
              { name: 'Username (Before)', value: oldUser.username, inline: true },
              { name: 'Username (After)', value: newUser.username, inline: true },
              { name: 'Action', value: 'Username Changed', inline: true },
              { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
            )
            .setColor('#f2c852')
            .setThumbnail(guild.iconURL())
            .setFooter({ text: guild.name, iconURL: guild.iconURL() })
            .setTimestamp()

          logChannel.send({ embeds: [embed] }).then(sent => {
            const fields = [
              { name: 'User', value: `<@${newUser.id}> (${newUser.tag})`, inline: false },
              { name: 'Username (Before)', value: oldUser.username, inline: true },
              { name: 'Username (After)', value: newUser.username, inline: true },
              { name: 'Action', value: 'Username Changed', inline: true },
              { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
            ]
            saveServerLog(guild.id, 'user', 'Username Changed', 0xf2c852, fields, row.channel_id, sent.id, guild.iconURL(), guild.name)
          }).catch(() => {})
        }
      )
    }
  })
}
