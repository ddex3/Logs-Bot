const { EmbedBuilder } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  const cacheDb = new sqlite3.Database(path.join(dataDir, 'MessageCache.db'))
  cacheDb.run(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    guild_id TEXT,
    channel_id TEXT,
    author_id TEXT,
    content TEXT,
    attachments TEXT
  )`)

  const logsDb = new sqlite3.Database(path.join(dataDir, 'logsChannels.db'))

  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!newMessage.guild || newMessage.author?.bot) return
    if (oldMessage.partial) { try { await oldMessage.fetch() } catch {} }

    const guild   = newMessage.guild
    const channel = newMessage.channel
    const author  = newMessage.author
    const timestamp = Math.floor(Date.now() / 1000)

    cacheDb.get(
      'SELECT content FROM messages WHERE id = ? AND guild_id = ?',
      [newMessage.id, guild.id],
      (_, row) => {
        const beforeRaw = row ? row.content : (oldMessage.content ?? '')
        if (beforeRaw === (newMessage.content ?? '')) return

        const beforeText = (beforeRaw || 'None').replace(/```/g, '```​').slice(0, 1024)
        const afterText  = (newMessage.content || 'None').replace(/```/g, '```​').slice(0, 1024)

        cacheDb.run(
          'INSERT OR REPLACE INTO messages(id,guild_id,channel_id,author_id,content,attachments) VALUES(?,?,?,?,?,?)',
          [newMessage.id, guild.id, channel.id, author.id, newMessage.content || '', '[]']
        )

        logsDb.get(
          "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Message Edited'",
          [guild.id],
          (_, row2) => {
            if (!row2) return
            const logChannel = guild.channels.cache.get(row2.channel_id)
            if (!logChannel) return

            const embed = new EmbedBuilder()
              .setTitle('Message Edited')
              .addFields(
                { name: 'Channel', value: `<#${channel.id}> (${channel.name})`, inline: true },
                { name: 'Author', value: `<@${author.id}> (${author.tag})`, inline: true },
                { name: 'Author ID', value: author.id, inline: true },
                { name: 'Before', value: beforeText, inline: false },
                { name: 'After',  value: afterText,  inline: false },
                { name: 'Edited At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
              )
              .setColor('#f2c852')
              .setThumbnail(guild.iconURL())
              .setFooter({ text: `${guild.client.user.username} • Message Edited`, iconURL: guild.client.user.displayAvatarURL() })
              .setTimestamp()

            logChannel.send({ embeds: [embed] }).then(sent => {
              const fields = [
                { name: 'Channel', value: `<#${channel.id}> (${channel.name})`, inline: true },
                { name: 'Author', value: `<@${author.id}> (${author.tag})`, inline: true },
                { name: 'Author ID', value: author.id, inline: true },
                { name: 'Before', value: beforeText, inline: false },
                { name: 'After',  value: afterText,  inline: false },
                { name: 'Edited At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
              ]
              saveServerLog(guild.id, 'message', 'Message Edited', 0xf2c852, fields, row2.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • Message Edited`)
            }).catch(() => {})
          }
        )
      }
    )
  })
}
