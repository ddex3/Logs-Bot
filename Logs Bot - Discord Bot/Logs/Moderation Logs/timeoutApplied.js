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

  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const oldTimeout = oldMember.communicationDisabledUntil
    const newTimeout = newMember.communicationDisabledUntil

    if (oldTimeout === newTimeout || !newTimeout) return

    const guild = newMember.guild
    const timestamp = Math.floor(Date.now() / 1000)
    const timeoutTimestamp = Math.floor(new Date(newTimeout).getTime() / 1000)

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 5 }).catch(() => null)
    const entry = logs?.entries.find(e => 
      e.target.id === newMember.id &&
      e.changes?.some(c => c.key === 'communication_disabled_until')
    )

    const executor = entry?.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : 'Unknown'
    const reason = entry?.reason || 'No reason provided'

    db.get("SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Timeout Applied'", [guild.id], (_, row) => {
      if (!row) return
      const logChannel = guild.channels.cache.get(row.channel_id)
      if (!logChannel) return

      const embed = new EmbedBuilder()
        .setTitle('Timeout Applied')
        .addFields(
          { name: 'User', value: `<@${newMember.id}> (${newMember.user.tag})`, inline: true },
          { name: 'ID', value: newMember.id, inline: true },
          { name: 'Muted By', value: executor, inline: true },
          { name: 'Until', value: `<t:${timeoutTimestamp}> (<t:${timeoutTimestamp}:R>)`, inline: false },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
        )
        .setColor('#f25252')
        .setFooter({ text: `${guild.client.user.username} • Timeout Applied`, iconURL: guild.client.user.displayAvatarURL() })
        .setThumbnail(newMember.displayAvatarURL())
        .setTimestamp()

      logChannel.send({ embeds: [embed] }).then(sent => {
        const fields = [
          { name: 'User', value: `<@${newMember.id}> (${newMember.user.tag})`, inline: true },
          { name: 'ID', value: newMember.id, inline: true },
          { name: 'Muted By', value: executor, inline: true },
          { name: 'Until', value: `<t:${timeoutTimestamp}> (<t:${timeoutTimestamp}:R>)`, inline: false },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
        ]
        saveServerLog(guild.id, 'moderation', 'Timeout Applied', 0xf25252, fields, row.channel_id, sent.id, newMember.displayAvatarURL(), `${guild.client.user.username} • Timeout Applied`)
      }).catch(() => {})
    })
  })
}
