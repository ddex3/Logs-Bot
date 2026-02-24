const { EmbedBuilder, ChannelType, AuditLogEvent } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')

  const db = new sqlite3.Database(dbPath)

  const typeNames = {
    [ChannelType.GuildText]: 'Text',
    [ChannelType.GuildVoice]: 'Voice',
    [ChannelType.GuildCategory]: 'Category',
    [ChannelType.GuildForum]: 'Forum',
    [ChannelType.GuildStageVoice]: 'Stage'
  }

  client.on('channelUpdate', async (oldChannel, newChannel) => {
    if (!newChannel.guild) return
    const guild = newChannel.guild
    const changes = []
    const actions = []
    const timestamp = Math.floor(Date.now() / 1000)

    let changedBy = 'Unknown'
    const auditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate, limit: 5 })
    const entry = auditLogs.entries.find(e => e.target?.id === newChannel.id)
    if (entry && entry.executor) {
      changedBy = `<@${entry.executor.id}> (${entry.executor.tag})`
    }

    if (oldChannel.name !== newChannel.name) {
      changes.push({ name: 'Name (Before)', value: oldChannel.name, inline: true })
      changes.push({ name: 'Name (After)', value: newChannel.name, inline: true })
      actions.push('Name Changed')
    }

    if ('topic' in oldChannel || 'topic' in newChannel) {
      const oldTopic = oldChannel.topic || 'None'
      const newTopic = newChannel.topic || 'None'
      if (oldTopic !== newTopic) {
        changes.push({ name: 'Topic (Before)', value: oldTopic, inline: false })
        changes.push({ name: 'Topic (After)', value: newTopic, inline: false })
        actions.push('Topic Changed')
      }
    }

    if (oldChannel.nsfw !== undefined && newChannel.nsfw !== undefined && oldChannel.nsfw !== newChannel.nsfw) {
      changes.push({ name: 'NSFW (Before)', value: `${oldChannel.nsfw}`, inline: true })
      changes.push({ name: 'NSFW (After)', value: `${newChannel.nsfw}`, inline: true })
      actions.push('NSFW Toggled')
    }

    if (oldChannel.rateLimitPerUser !== undefined && newChannel.rateLimitPerUser !== undefined &&
        oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
      changes.push({ name: 'Slowmode (Before)', value: `${oldChannel.rateLimitPerUser}s`, inline: true })
      changes.push({ name: 'Slowmode (After)', value: `${newChannel.rateLimitPerUser}s`, inline: true })
      actions.push('Slowmode Changed')
    }

    if (oldChannel.bitrate !== undefined && newChannel.bitrate !== undefined &&
        oldChannel.bitrate !== newChannel.bitrate) {
      changes.push({ name: 'Bitrate (Before)', value: `${oldChannel.bitrate}`, inline: true })
      changes.push({ name: 'Bitrate (After)', value: `${newChannel.bitrate}`, inline: true })
      actions.push('Bitrate Changed')
    }

    if (oldChannel.userLimit !== undefined && newChannel.userLimit !== undefined &&
        oldChannel.userLimit !== newChannel.userLimit) {
      changes.push({ name: 'User Limit (Before)', value: `${oldChannel.userLimit || 'None'}`, inline: true })
      changes.push({ name: 'User Limit (After)', value: `${newChannel.userLimit || 'None'}`, inline: true })
      actions.push('User Limit Changed')
    }

    if (oldChannel.type !== newChannel.type) {
      changes.push({ name: 'Type (Before)', value: typeNames[oldChannel.type] || 'Unknown', inline: true })
      changes.push({ name: 'Type (After)', value: typeNames[newChannel.type] || 'Unknown', inline: true })
      actions.push('Type Changed')
    }

    if (!changes.length) return

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Channel Updated'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Channel Updated')
          .addFields(
            { name: 'Channel', value: `<#${newChannel.id}> (${newChannel.name})`, inline: false },
            { name: 'Action', value: actions.join(', '), inline: false },
            { name: 'Changed By', value: changedBy, inline: false },
            ...changes,
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f2c852')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: guild.name, iconURL: guild.iconURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).catch(() => {})
      }
    )
  })
}
