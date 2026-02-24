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

  client.on('stageInstanceUpdate', async (oldStage, newStage) => {
    const guild = newStage.guild
    const timestamp = Math.floor(Date.now() / 1000)
    const changes = []

    if (oldStage.topic !== newStage.topic) {
      changes.push(
        { name: 'Topic (Before)', value: oldStage.topic || 'None', inline: false },
        { name: 'Topic (After)', value: newStage.topic || 'None', inline: false }
      )
    }

    if (!changes.length) return

    let executor = 'Unknown'
    try {
      const fetchedLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.StageInstanceUpdate,
        limit: 5
      })

      const log = fetchedLogs.entries.find(entry =>
        Date.now() - entry.createdTimestamp < 5000
      )

      if (log?.executor) {
        executor = `<@${log.executor.id}> (${log.executor.tag})`
      }
    } catch {}

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Stage Updated'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Stage Updated')
          .addFields(
            { name: 'Stage Channel', value: `<#${newStage.channelId}> (${newStage.channel?.name || 'Unknown'})`, inline: false },
            { name: 'Action', value: 'Topic Updated', inline: false },
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
            { name: 'Stage Channel', value: `<#${newStage.channelId}> (${newStage.channel?.name || 'Unknown'})`, inline: false },
            { name: 'Action', value: 'Topic Updated', inline: false },
            ...changes,
            { name: 'Changed By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'stage', 'Stage Updated', 0xf2c852, fields, row.channel_id, sent.id, guild.iconURL(), guild.name)
        }).catch(() => {})
      }
    )
  })
}
