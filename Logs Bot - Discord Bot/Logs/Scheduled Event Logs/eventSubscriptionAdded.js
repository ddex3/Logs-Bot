const { EmbedBuilder } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')

  const db = new sqlite3.Database(dbPath)

  client.on('guildScheduledEventUserAdd', async (event, user) => {
    const guild = client.guilds.cache.get(event.guildId)
    if (!guild) return

    const timestamp = Math.floor(Date.now() / 1000)

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Event Subscription Added'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('User Subscribed to Event')
          .addFields(
            { name: 'Event', value: `${event.name}`, inline: true },
            { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
            { name: 'Action', value: 'Event Subscription Added', inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#67e68d')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: guild.name, iconURL: guild.iconURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Event', value: `${event.name}`, inline: true },
            { name: 'User', value: `<@${user.id}> (${user.tag})`, inline: true },
            { name: 'Action', value: 'Event Subscription Added', inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'event', 'Event Subscription Added', 0x67e68d, fields, row.channel_id, sent.id, guild.iconURL(), guild.name)
        }).catch(() => {})
      }
    )
  })
}
