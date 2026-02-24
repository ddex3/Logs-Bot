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

  client.on('stageInstanceCreate', async stage => {
    const guild = stage.guild
    const timestamp = Math.floor(Date.now() / 1000)

    let executor = 'Unknown'
    try {
      const fetchedLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.StageInstanceCreate,
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
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Stage Started'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Stage Started')
          .addFields(
            { name: 'Stage Channel', value: `<#${stage.channelId}> (${stage.channel?.name || 'Unknown'})`, inline: false },
            { name: 'Topic', value: stage.topic || 'None', inline: false },
            { name: 'Started By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#67e68d')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: guild.name, iconURL: guild.iconURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Stage Channel', value: `<#${stage.channelId}> (${stage.channel?.name || 'Unknown'})`, inline: false },
            { name: 'Topic', value: stage.topic || 'None', inline: false },
            { name: 'Started By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'stage', 'Stage Started', 0x67e68d, fields, row.channel_id, sent.id, guild.iconURL(), guild.name)
        }).catch(() => {})
      }
    )
  })
}
