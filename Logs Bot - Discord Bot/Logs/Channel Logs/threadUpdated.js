const { EmbedBuilder, AuditLogEvent } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')

  const db = new sqlite3.Database(dbPath)

  client.on('threadUpdate', async (oldThread, newThread) => {
    if (!newThread.guild) return
    const guild = newThread.guild
    const changes = []
    const actions = []
    const timestamp = Math.floor(Date.now() / 1000)

    let changedBy = 'Unknown'
    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ThreadUpdate, limit: 5 })
      const entry = logs.entries.find(e => e.target?.id === newThread.id)
      if (entry?.executor) {
        changedBy = `<@${entry.executor.id}> (${entry.executor.tag})`
      }
    } catch {}

    if (oldThread.name !== newThread.name) {
      changes.push({ name: 'Name (Before)', value: oldThread.name, inline: true })
      changes.push({ name: 'Name (After)', value: newThread.name, inline: true })
      actions.push('Name Changed')
    }

    if (oldThread.archived !== newThread.archived) {
      changes.push({ name: 'Archived (Before)', value: `${oldThread.archived}`, inline: true })
      changes.push({ name: 'Archived (After)', value: `${newThread.archived}`, inline: true })
      actions.push('Archived Toggled')
    }

    if (oldThread.locked !== newThread.locked) {
      changes.push({ name: 'Locked (Before)', value: `${oldThread.locked}`, inline: true })
      changes.push({ name: 'Locked (After)', value: `${newThread.locked}`, inline: true })
      actions.push('Locked Toggled')
    }

    if (oldThread.autoArchiveDuration !== newThread.autoArchiveDuration) {
      changes.push({ name: 'Auto-archive (Before)', value: `${oldThread.autoArchiveDuration}m`, inline: true })
      changes.push({ name: 'Auto-archive (After)', value: `${newThread.autoArchiveDuration}m`, inline: true })
      actions.push('Auto-archive Duration Changed')
    }

    if (oldThread.rateLimitPerUser !== newThread.rateLimitPerUser) {
      changes.push({ name: 'Slowmode (Before)', value: `${oldThread.rateLimitPerUser || 0}s`, inline: true })
      changes.push({ name: 'Slowmode (After)', value: `${newThread.rateLimitPerUser || 0}s`, inline: true })
      actions.push('Slowmode Changed')
    }

    if (!changes.length) return

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Thread Updated'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Thread Updated')
          .addFields(
            { name: 'Thread', value: `${newThread.name}`, inline: false },
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
