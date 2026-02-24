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

  const entityTypeMap = {
    1: 'Stage Instance',
    2: 'Voice Channel',
    3: 'External Event'
  }

  client.on('guildScheduledEventUpdate', async (oldEvent, newEvent) => {
    const guild = newEvent.guild
    if (!guild) return

    if (oldEvent.status !== newEvent.status && newEvent.status === 3) {
      const timestamp = Math.floor(Date.now() / 1000)

      db.get(
        "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Scheduled Event Ended'",
        [guild.id],
        async (_, row) => {
          if (!row) return
          const logChannel = guild.channels.cache.get(row.channel_id)
          if (!logChannel) return

          const embed = new EmbedBuilder()
            .setTitle('Scheduled Event Ended')
            .addFields(
              { name: 'Name', value: `${newEvent.name}`, inline: true },
              { name: 'Type', value: entityTypeMap[newEvent.entityType] || 'Unknown', inline: true },
              { name: 'Location', value: `${newEvent.channel ? `<#${newEvent.channel.id}> (${newEvent.channel.name})` : newEvent.entityMetadata?.location || 'Unknown'}`, inline: false },
              { name: 'Start Time', value: `<t:${Math.floor(newEvent.scheduledStartTimestamp / 1000)}>`, inline: true },
              { name: 'End Time', value: newEvent.scheduledEndTimestamp ? `<t:${Math.floor(newEvent.scheduledEndTimestamp / 1000)}>` : 'Not set', inline: true },
              { name: 'Action', value: 'Scheduled Event Ended', inline: true },
              { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
            )
            .setColor('#f25252')
            .setThumbnail(guild.iconURL())
            .setFooter({ text: guild.name, iconURL: guild.iconURL() })
            .setTimestamp()

          logChannel.send({ embeds: [embed] }).then(sent => {
            const fields = [
              { name: 'Name', value: `${newEvent.name}`, inline: true },
              { name: 'Type', value: entityTypeMap[newEvent.entityType] || 'Unknown', inline: true },
              { name: 'Location', value: `${newEvent.channel ? `<#${newEvent.channel.id}> (${newEvent.channel.name})` : newEvent.entityMetadata?.location || 'Unknown'}`, inline: false },
              { name: 'Start Time', value: `<t:${Math.floor(newEvent.scheduledStartTimestamp / 1000)}>`, inline: true },
              { name: 'End Time', value: newEvent.scheduledEndTimestamp ? `<t:${Math.floor(newEvent.scheduledEndTimestamp / 1000)}>` : 'Not set', inline: true },
              { name: 'Action', value: 'Scheduled Event Ended', inline: true },
              { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
            ]
            saveServerLog(guild.id, 'event', 'Scheduled Event Ended', 0xf25252, fields, row.channel_id, sent.id, guild.iconURL(), guild.name)
          }).catch(() => {})
        }
      )
    }
  })
}
