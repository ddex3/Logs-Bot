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

  client.on('emojiUpdate', async (oldEmoji, newEmoji) => {
    const guild = newEmoji.guild
    const timestamp = Math.floor(Date.now() / 1000)
    const changes = []

    if (oldEmoji.name !== newEmoji.name) {
      changes.push(
        { name: 'Name (Before)', value: oldEmoji.name, inline: true },
        { name: 'Name (After)', value: newEmoji.name, inline: true }
      )
    }

    if (!changes.length) return

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.EmojiUpdate, limit: 1 })
    const entry = logs.entries.find(e => e.target.id === newEmoji.id)
    const executor = entry?.executor
      ? `<@${entry.executor.id}> (${entry.executor.tag})`
      : 'Unknown'

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Emoji Updated'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Emoji Updated')
          .addFields(
            { name: 'Emoji', value: `${newEmoji.toString()} \`${newEmoji.name}\``, inline: false },
            ...changes,
            { name: 'Updated By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f2c852')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: `${guild.client.user.username} • Emoji Updated`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Emoji', value: `${newEmoji.toString()} \`${newEmoji.name}\``, inline: false },
            ...changes,
            { name: 'Updated By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'emoji', 'Emoji Updated', 0xf2c852, fields, row.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • Emoji Updated`)
        }).catch(() => {})
      }
    )
  })
}
