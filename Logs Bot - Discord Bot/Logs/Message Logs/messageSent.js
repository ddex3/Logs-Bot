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

  client.on('messageCreate', async message => {
    if (message.partial) { try { await message.fetch() } catch { return } }
    if (!message.guild || message.author.bot) return
    const guild = message.guild
    const channel = message.channel
    const author = message.author
    const timestamp = Math.floor(Date.now() / 1000)
    cacheDb.run(
      'INSERT OR REPLACE INTO messages(id,guild_id,channel_id,author_id,content,attachments) VALUES(?,?,?,?,?,?)',
      [message.id, guild.id, channel.id, author.id, message.content || '', JSON.stringify(message.attachments.map(a => ({ name: a.name, url: a.url })))]
    )
    logsDb.get("SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Message Sent'", [guild.id], (_, row) => {
      if (!row) return
      const logChannel = guild.channels.cache.get(row.channel_id)
      if (!logChannel) return
      const embed = new EmbedBuilder()
        .setTitle('Message Sent')
        .addFields(
          { name: 'Channel', value: `<#${channel.id}> (${channel.name})`, inline: true },
          { name: 'Author', value: `<@${author.id}> (${author.tag})`, inline: true },
          { name: 'Author ID', value: author.id, inline: true },
          { name: 'Message ID', value: message.id, inline: true },
          { name: 'Content', value: message.content ? message.content.replace(/```/g,'```​').slice(0,1024) : 'No text content', inline: false },
          { name: 'Attachments', value: message.attachments.size ? message.attachments.map(a=>`[${a.name}](${a.url})`).join('\n').slice(0,1024) : 'None', inline: false },
          { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
        )
        .setColor('#67e68d')
        .setThumbnail(guild.iconURL())
        .setFooter({ text: `${guild.client.user.username} • Message Sent`, iconURL: guild.client.user.displayAvatarURL() })
        .setTimestamp()
      logChannel.send({ embeds: [embed] }).then(sent => {
        try {
          const fields = [
            { name: 'Channel', value: `<#${channel.id}> (${channel.name})`, inline: true },
            { name: 'Author', value: `<@${author.id}> (${author.tag})`, inline: true },
            { name: 'Author ID', value: author.id, inline: true },
            { name: 'Message ID', value: message.id, inline: true },
            { name: 'Content', value: message.content ? message.content.replace(/```/g,'```\u200b').slice(0,1024) : 'No text content', inline: false },
            { name: 'Attachments', value: message.attachments.size ? message.attachments.map(a=>`[${a.name}](${a.url})`).join('\n').slice(0,1024) : 'None', inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'message', 'Message Sent', 0x67e68d, fields, row.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • Message Sent`)
        } catch (e) {}
      }).catch(() => {})
    })
  })
}
