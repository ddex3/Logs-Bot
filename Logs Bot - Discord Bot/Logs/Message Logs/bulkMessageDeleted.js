const { EmbedBuilder, AuditLogEvent, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const crypto = require('crypto')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')
  const transcriptsDbPath = path.join(dataDir, 'BulkMessagesLogs.db')

  const db = new sqlite3.Database(dbPath)
  const transcriptsDb = new sqlite3.Database(transcriptsDbPath)
  const cacheDb = new sqlite3.Database(path.join(dataDir, 'MessageCache.db'))

  transcriptsDb.serialize(() => {
    transcriptsDb.all(`PRAGMA table_info(transcripts)`, (err, rows) => {
      if (err || !rows || rows.length === 0) {
        transcriptsDb.run(`CREATE TABLE transcripts (
          id TEXT PRIMARY KEY,
          guild_id TEXT,
          channel_id TEXT,
          timestamp INTEGER,
          messages_count INTEGER,
          deleted_by TEXT,
          transcript_base64 TEXT
        )`)
      } else {
        const idColumn = rows.find(r => r.name === 'id')
        if (idColumn && idColumn.type.toUpperCase() !== 'TEXT') {
          transcriptsDb.run(`DROP TABLE transcripts`, () => {
            transcriptsDb.run(`CREATE TABLE transcripts (
              id TEXT PRIMARY KEY,
              guild_id TEXT,
              channel_id TEXT,
              timestamp INTEGER,
              messages_count INTEGER,
              deleted_by TEXT,
              transcript_base64 TEXT
            )`)
          })
        }
      }
    })
  })

  client.on('messageDeleteBulk', async (messages, channel) => {
    const guild = channel.guild
    if (!guild) return
    const timestamp = Math.floor(Date.now() / 1000)
    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MessageBulkDelete, limit: 5 }).catch(() => null)
    const entry = logs?.entries.find(e => {
      const timeDiff = Date.now() - e.createdTimestamp
      return timeDiff < 10000 && (e.extra?.count === messages.size || e.target?.id === channel.id)
    })
    const executor = entry?.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : 'Unknown'
    const sorted = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp)

    const transcriptDataPromises = sorted.map(m => {
      return new Promise((resolve) => {
        const member = guild.members.cache.get(m.author?.id)
        const messageData = {
          message_id: m.id,
          authorName: member ? member.displayName : m.author?.username || 'Unknown',
          authorUserName: m.author?.username || 'Unknown',
          authorId: m.author?.id || 'Unknown',
          createdTimestamp: m.createdTimestamp,
          channel_id: channel.id,
          channel_name: channel.name,
          guild_id: guild.id,
          user_avatar: member ? member.displayAvatarURL({ extension: 'png', size: 128 }) : (m.author ? m.author.displayAvatarURL({ extension: 'png', size: 128 }) : ''),
          user_role_color: member?.displayHexColor || '#000000'
        }

        if (m.editedTimestamp) messageData.editedTimestamp = m.editedTimestamp
        if (m.content) messageData.content = m.content
        if (m.pinned) messageData.pinned = m.pinned

        let attachments = m.attachments?.map(a => ({ name: a.name, url: a.url, size: a.size, contentType: a.contentType })) || []
        
        const processMessageData = () => {
          const embeds = m.embeds?.map(e => {
            const embedData = {}
            if (e.title) embedData.title = e.title
            if (e.description) embedData.description = e.description
            if (e.url) embedData.url = e.url
            if (e.color) embedData.color = e.color
            if (e.timestamp) embedData.timestamp = e.timestamp
            const fields = e.fields?.map(f => ({ name: f.name, value: f.value, inline: f.inline })) || []
            if (fields.length > 0) embedData.fields = fields
            return embedData
          }).filter(e => Object.keys(e).length > 0) || []
          if (embeds.length > 0) messageData.embeds = embeds

          const reactions = m.reactions?.cache?.map(r => ({
            emoji: r.emoji.toString(),
            count: r.count,
            me: r.me
          })) || []
          if (reactions.length > 0) messageData.reactions = reactions

          const mentionsUsers = m.mentions?.users?.map(u => ({ id: u.id, username: u.username, tag: u.tag })) || []
          const mentionsRoles = m.mentions?.roles?.map(r => ({ id: r.id, name: r.name })) || []
          const mentionsChannels = m.mentions?.channels?.map(c => ({ id: c.id, name: c.name })) || []
          if (mentionsUsers.length > 0 || mentionsRoles.length > 0 || mentionsChannels.length > 0) {
            messageData.mentions = {}
            if (mentionsUsers.length > 0) messageData.mentions.users = mentionsUsers
            if (mentionsRoles.length > 0) messageData.mentions.roles = mentionsRoles
            if (mentionsChannels.length > 0) messageData.mentions.channels = mentionsChannels
          }

          resolve(messageData)
        }
        
        if (attachments.length === 0) {
          cacheDb.get('SELECT attachments FROM messages WHERE id = ?', [m.id], (_, row) => {
            if (row && row.attachments) {
              try {
                const cachedAttachments = JSON.parse(row.attachments)
                attachments = cachedAttachments.map(a => ({ 
                  name: a.name, 
                  url: a.url, 
                  size: a.size || null, 
                  contentType: a.contentType || null 
                }))
              } catch (e) {}
            }
            if (attachments.length > 0) messageData.attachments = attachments
            processMessageData()
          })
        } else {
          if (attachments.length > 0) messageData.attachments = attachments
          processMessageData()
        }
      })
    })

    const transcriptData = await Promise.all(transcriptDataPromises)

    db.get("SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Bulk Message Deleted'", [guild.id], async (_, row) => {
      if (!row) return
      const logChannel = guild.channels.cache.get(row.channel_id)
      if (!logChannel) return

      const transcriptId = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
      const transcriptJson = JSON.stringify({
        id: transcriptId,
        messagesCount: messages.size,
        messages: transcriptData
      })
      const compressed = zlib.gzipSync(Buffer.from(transcriptJson, 'utf8'))
      const transcriptBase64 = compressed.toString('base64')

      transcriptsDb.run(
        'INSERT INTO transcripts (id, guild_id, channel_id, timestamp, messages_count, deleted_by, transcript_base64) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [transcriptId, guild.id, channel.id, timestamp, messages.size, executor, transcriptBase64],
        (err) => {
          if (err) {
            console.error('Error saving transcript:', err)
          }
        }
      )

      const embed = new EmbedBuilder().setTitle('Bulk Messages Transcript').addFields(
        { name: 'Channel', value: `<#${channel.id}> (${channel.name})`, inline: true },
        { name: 'Messages', value: `${messages.size}`, inline: true },
        { name: 'Deleted By', value: executor, inline: true },
        { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)` }
      ).setColor('#f25252').setThumbnail(guild.iconURL()).setFooter({ text: `${guild.client.user.username} • Bulk Messages Transcript`, iconURL: guild.client.user.displayAvatarURL() }).setTimestamp()
      
      const button = new ButtonBuilder()
        .setLabel('View Transcript')
        .setStyle(ButtonStyle.Link)
        .setURL(`http://logsbot.com/${guild.id}/dashboard/transcripts/${transcriptId}`)
      
      const actionRow = new ActionRowBuilder().addComponents(button)
      
      logChannel.send({ embeds: [embed], components: [actionRow] }).then(sent => {
        const fields = [
          { name: 'Channel', value: `<#${channel.id}> (${channel.name})`, inline: true },
          { name: 'Messages', value: `${messages.size}`, inline: true },
          { name: 'Deleted By', value: executor, inline: true },
          { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)` }
        ]
        saveServerLog(guild.id, 'message', 'Bulk Messages Transcript', 0xf25252, fields, row.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • Bulk Messages Transcript`)
      }).catch((err) => {
        console.error('Error sending bulk message log:', err)
      })
    })
  })
}
