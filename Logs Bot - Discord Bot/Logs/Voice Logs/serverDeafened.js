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

  client.on('voiceStateUpdate', async (oldState, newState) => {
    if (oldState.serverDeaf || !newState.serverDeaf) return
    const guild = newState.guild
    if (!guild) return

    const member = newState.member
    const channel = newState.channel || oldState.channel
    const timestamp = Math.floor(Date.now() / 1000)

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 5 }).catch(() => null)
    const entry = logs?.entries.find(e =>
      e.target.id === member.id &&
      e.changes.some(c => c.key === 'deaf' && c.new === true) &&
      Date.now() - e.createdTimestamp < 5000
    )
    const executor = entry?.executor ? `<@${entry.executor.id}> (${entry.executor.tag})` : 'Unknown'

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Server Deafened'",
      [guild.id],
      (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Server Deafened')
          .addFields(
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Channel', value: channel ? `<#${channel.id}> (${channel.name})` : 'None', inline: true },
            { name: 'Deafened By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f25252')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: `${guild.client.user.username} • Server Deafened`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Channel', value: channel ? `<#${channel.id}> (${channel.name})` : 'None', inline: true },
            { name: 'Deafened By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'voice', 'Server Deafened', 0xf25252, fields, row.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • Server Deafened`)
        }).catch(() => {})
      }
    )
  })
}
