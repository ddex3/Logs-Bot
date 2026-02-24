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

  client.on('emojiCreate', async emoji => {
    const guild = emoji.guild
    const timestamp = Math.floor(Date.now() / 1000)

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.EmojiCreate, limit: 1 })
    const entry = logs.entries.find(e => e.target.id === emoji.id)
    const executor = entry?.executor
      ? `<@${entry.executor.id}> (${entry.executor.tag})`
      : 'Unknown'

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Emoji Created'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Emoji Created')
          .addFields(
            { name: 'Emoji', value: `${emoji}`, inline: true },
            { name: 'Name', value: emoji.name, inline: true },
            { name: 'ID', value: emoji.id, inline: true },
            { name: 'Animated', value: emoji.animated ? 'True' : 'False', inline: true },
            { name: 'Created By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#67e68d')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: `${guild.client.user.username} • Emoji Created`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Emoji', value: `${emoji}`, inline: true },
            { name: 'Name', value: emoji.name, inline: true },
            { name: 'ID', value: emoji.id, inline: true },
            { name: 'Animated', value: emoji.animated ? 'True' : 'False', inline: true },
            { name: 'Created By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'emoji', 'Emoji Created', 0x67e68d, fields, row.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • Emoji Created`)
        }).catch(() => {})
      }
    )
  })
}
