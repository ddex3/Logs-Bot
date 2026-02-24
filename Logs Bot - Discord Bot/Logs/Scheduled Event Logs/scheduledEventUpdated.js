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

  client.on('guildScheduledEventUpdate', async (oldEvent, newEvent) => {
    const guild = newEvent.guild
    if (!guild) return

    const changes = []

    if (oldEvent.name !== newEvent.name) {
      changes.push({ name: 'Name (Before)', value: oldEvent.name || 'None', inline: true })
      changes.push({ name: 'Name (After)', value: newEvent.name || 'None', inline: true })
    }

    if (oldEvent.description !== newEvent.description) {
      changes.push({ name: 'Description (Before)', value: oldEvent.description || 'None', inline: false })
      changes.push({ name: 'Description (After)', value: newEvent.description || 'None', inline: false })
    }

    if (oldEvent.scheduledStartTimestamp !== newEvent.scheduledStartTimestamp) {
      changes.push({ name: 'Start Time (Before)', value: `<t:${Math.floor(oldEvent.scheduledStartTimestamp / 1000)}>`, inline: true })
      changes.push({ name: 'Start Time (After)', value: `<t:${Math.floor(newEvent.scheduledStartTimestamp / 1000)}>`, inline: true })
    }

    if (oldEvent.scheduledEndTimestamp !== newEvent.scheduledEndTimestamp) {
      changes.push({ name: 'End Time (Before)', value: oldEvent.scheduledEndTimestamp ? `<t:${Math.floor(oldEvent.scheduledEndTimestamp / 1000)}>` : 'None', inline: true })
      changes.push({ name: 'End Time (After)', value: newEvent.scheduledEndTimestamp ? `<t:${Math.floor(newEvent.scheduledEndTimestamp / 1000)}>` : 'None', inline: true })
    }

    if (oldEvent.channel?.id !== newEvent.channel?.id) {
      const oldCh = oldEvent.channel ? `<#${oldEvent.channel.id}> (${oldEvent.channel.name})` : oldEvent.entityMetadata?.location || 'None'
      const newCh = newEvent.channel ? `<#${newEvent.channel.id}> (${newEvent.channel.name})` : newEvent.entityMetadata?.location || 'None'
      changes.push({ name: 'Location (Before)', value: oldCh, inline: false })
      changes.push({ name: 'Location (After)', value: newCh, inline: false })
    }

    if (!changes.length) return

    const timestamp = Math.floor(Date.now() / 1000)
    const auditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.GuildScheduledEventUpdate, limit: 1 })
    const entry = auditLogs.entries.find(e => e.target?.id === newEvent.id)
    const executor = entry?.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : 'Unknown'

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Scheduled Event Updated'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Scheduled Event Updated')
          .addFields(
            { name: 'Event', value: `${newEvent.name}`, inline: false },
            ...changes,
            { name: 'Changed By', value: executor, inline: false },
            { name: 'Action', value: 'Scheduled Event Updated', inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f2c852')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: guild.name, iconURL: guild.iconURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Event', value: `${newEvent.name}`, inline: false },
            ...changes,
            { name: 'Changed By', value: executor, inline: false },
            { name: 'Action', value: 'Scheduled Event Updated', inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'event', 'Scheduled Event Updated', 0xf2c852, fields, row.channel_id, sent.id, guild.iconURL(), guild.name)
        }).catch(() => {})
      }
    )
  })
}
