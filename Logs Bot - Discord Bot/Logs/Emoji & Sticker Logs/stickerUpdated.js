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

  client.on('stickerUpdate', async (oldSticker, newSticker) => {
    const guild = newSticker.guild
    const timestamp = Math.floor(Date.now() / 1000)

    const changes = []

    if (oldSticker.name !== newSticker.name) {
      changes.push(
        { name: 'Name (Before)', value: oldSticker.name, inline: false },
        { name: 'Name (After)', value: newSticker.name, inline: false }
      )
    }

    if (oldSticker.description !== newSticker.description) {
      changes.push(
        { name: 'Description (Before)', value: oldSticker.description || 'None', inline: false },
        { name: 'Description (After)', value: newSticker.description || 'None', inline: false }
      )
    }


    if (!changes.length) return

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.StickerUpdate, limit: 1 })
    const entry = logs.entries.find(e => e.target.id === newSticker.id)
    const executor = entry?.executor
      ? `<@${entry.executor.id}> (${entry.executor.tag})`
      : 'Unknown'

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Sticker Updated'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Sticker Updated')
          .addFields(
            { name: 'Sticker', value: `${newSticker.name}`, inline: false },
            { name: 'Updated By', value: executor, inline: false },
            ...changes,
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f2c852')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: `${guild.client.user.username} • Sticker Updated`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Sticker', value: `${newSticker.name}`, inline: false },
            { name: 'Updated By', value: executor, inline: false },
            ...changes,
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'sticker', 'Sticker Updated', 0xf2c852, fields, row.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • Sticker Updated`)
        }).catch(() => {})
      }
    )
  })
}
