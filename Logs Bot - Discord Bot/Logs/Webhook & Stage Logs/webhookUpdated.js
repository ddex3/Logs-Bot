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

  client.on('webhookUpdate', async channel => {
    const guild = channel.guild
    const timestamp = Math.floor(Date.now() / 1000)

    let logData
    try {
      const fetchedLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.WebhookUpdate, limit: 1 })
      logData = fetchedLogs.entries.find(entry =>
        Date.now() - entry.createdTimestamp < 3000
      )
    } catch {}

    if (!logData) return

    const executor = logData.executor
      ? `<@${logData.executor.id}> (${logData.executor.tag})`
      : 'Unknown'

    const changes = []

    for (const change of logData.changes || []) {
      if (change.key === 'name') {
        changes.push(
          { name: 'Name (Before)', value: change.old || 'Unknown', inline: true },
          { name: 'Name (After)', value: change.new || 'Unknown', inline: true }
        )
      } else if (change.key === 'channel_id') {
        const oldChan = guild.channels.cache.get(change.old)
        const newChan = guild.channels.cache.get(change.new)
        changes.push(
          { name: 'Channel (Before)', value: oldChan ? `<#${oldChan.id}> (${oldChan.name})` : 'Unknown', inline: true },
          { name: 'Channel (After)', value: newChan ? `<#${newChan.id}> (${newChan.name})` : 'Unknown', inline: true }
        )
      } else if (change.key === 'avatar_hash') {
        const oldAvatar = change.old
          ? `[Old Avatar](https://cdn.discordapp.com/avatars/${logData.target.id}/${change.old}.png)`
          : 'None'
        const newAvatar = change.new
          ? `[New Avatar](https://cdn.discordapp.com/avatars/${logData.target.id}/${change.new}.png)`
          : 'None'
        changes.push(
          { name: 'Avatar (Before)', value: oldAvatar, inline: true },
          { name: 'Avatar (After)', value: newAvatar, inline: true }
        )
      }
    }

    if (!changes.length) return

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Webhook Updated'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Webhook Updated')
          .addFields(
            { name: 'Channel', value: `<#${channel.id}> (${channel.name})`, inline: false },
            { name: 'Action', value: 'Webhook properties updated', inline: false },
            ...changes,
            { name: 'Changed By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f2c852')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: guild.name, iconURL: guild.iconURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Channel', value: `<#${channel.id}> (${channel.name})`, inline: false },
            { name: 'Action', value: 'Webhook properties updated', inline: false },
            ...changes,
            { name: 'Changed By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'webhook', 'Webhook Updated', 0xf2c852, fields, row.channel_id, sent.id, guild.iconURL(), guild.name)
        }).catch(() => {})
      }
    )
  })
}
