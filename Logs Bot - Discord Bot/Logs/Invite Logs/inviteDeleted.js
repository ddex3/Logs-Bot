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

  client.on('inviteDelete', async invite => {
    const guild = invite.guild
    const timestamp = Math.floor(Date.now() / 1000)

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.InviteDelete, limit: 1 })
    const entry = logs.entries.find(e => e.target.code === invite.code)
    const executor = entry?.executor
      ? `<@${entry.executor.id}> (${entry.executor.tag})`
      : 'Unknown'

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Invite Deleted'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Invite Deleted')
          .addFields(
            { name: 'Code', value: invite.code, inline: true },
            { name: 'Channel', value: invite.channel ? `<#${invite.channel.id}>` : 'Unknown', inline: true },
            { name: 'Deleted By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f25252')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: `${guild.client.user.username} • Invite Deleted`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Code', value: invite.code, inline: true },
            { name: 'Channel', value: invite.channel ? `<#${invite.channel.id}>` : 'Unknown', inline: true },
            { name: 'Deleted By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'invite', 'Invite Deleted', 0xf25252, fields, row.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • Invite Deleted`)
        }).catch(() => {})
      }
    )
  })
}
