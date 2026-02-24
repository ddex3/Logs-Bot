const { EmbedBuilder, AuditLogEvent } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
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

  client.on('messageDelete', async message => {
    if (message.partial) { try { await message.fetch() } catch {} }
    if (!message.guild || message.author?.bot) return
    const guild = message.guild
    const channel = message.channel
    const author = message.author
    const timestamp = Math.floor(Date.now() / 1000)
    let executor = 'Unknown'
    try {
      const audit = await guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 6 })
      const entry = audit.entries.find(e =>
        Date.now() - e.createdTimestamp < 8000 &&
        e.extra?.channel?.id === channel.id &&
        e.target.id === author.id
      )
      if (entry?.executor) executor = `<@${entry.executor.id}> (${entry.executor.tag})`
      else executor = `<@${author.id}> (${author.tag}) - Self`
    } catch {}
    let content = message.content
    let attachmentsTxt = null
    cacheDb.get('SELECT content,attachments FROM messages WHERE id = ?', [message.id], (_, row) => {
      if (!content && row) content = row.content
      if (row && !attachmentsTxt) {
        const arr = JSON.parse(row.attachments || '[]')
        attachmentsTxt = arr.length ? arr.map(a => `[${a.name}](${a.url})`).join('\n').slice(0, 1024) : 'None'
      }
      cacheDb.run('DELETE FROM messages WHERE id = ?', [message.id])
    })
    content = content ? content.replace(/```/g, '```​').slice(0, 1024) : 'No text content'
    if (!attachmentsTxt) attachmentsTxt = message.attachments.size ? message.attachments.map(a => `[${a.name}](${a.url})`).join('\n').slice(0, 1024) : 'None'
    logsDb.get("SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Message Deleted'", [guild.id], (_, row) => {
      if (!row) return
      const logChannel = guild.channels.cache.get(row.channel_id)
      if (!logChannel) return
      const embed = new EmbedBuilder()
        .setTitle('Message Deleted')
        .addFields(
          { name: 'Channel', value: `<#${channel.id}> (${channel.name})`, inline: true },
          { name: 'Author', value: `<@${author.id}> (${author.tag})`, inline: true },
          { name: 'Author ID', value: author.id, inline: true },
          { name: 'Deleted By', value: executor, inline: false },
          { name: 'Content', value: content, inline: false },
          { name: 'Attachments', value: attachmentsTxt, inline: false },
          { name: 'Deleted At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
        )
        .setColor('#f25252')
        .setThumbnail(guild.iconURL())
        .setFooter({ text: `${guild.client.user.username} • Message Deleted`, iconURL: guild.client.user.displayAvatarURL() })
        .setTimestamp()
      logChannel.send({ embeds: [embed] }).then(sent => {
        const fields = [
          { name: 'Channel', value: `<#${channel.id}> (${channel.name})`, inline: true },
          { name: 'Author', value: `<@${author.id}> (${author.tag})`, inline: true },
          { name: 'Author ID', value: author.id, inline: true },
          { name: 'Deleted By', value: executor, inline: false },
          { name: 'Content', value: content, inline: false },
          { name: 'Attachments', value: attachmentsTxt, inline: false },
          { name: 'Deleted At', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
        ]
        saveServerLog(guild.id, 'message', 'Message Deleted', 0xf25252, fields, row.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • Message Deleted`)
      }).catch(() => {})
    })
  })
}
