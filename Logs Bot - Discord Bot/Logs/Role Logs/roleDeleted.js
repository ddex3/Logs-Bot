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

  client.on('roleDelete', async role => {
    const guild = role.guild
    const timestamp = Math.floor(Date.now() / 1000)

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 })
    const entry = logs.entries.find(e => e.target.id === role.id)
    const executor = entry?.executor
      ? `<@${entry.executor.id}> (${entry.executor.tag})`
      : 'Unknown'

    const capitalize = val => val.toString().charAt(0).toUpperCase() + val.toString().slice(1)

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Role Deleted'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Role Deleted')
          .addFields(
            { name: 'Role', value: `${role.name}`, inline: true },
            { name: 'ID', value: role.id, inline: true },
            { name: 'Color', value: role.hexColor, inline: true },
            { name: 'Hoisted', value: capitalize(role.hoist), inline: true },
            { name: 'Mentionable', value: capitalize(role.mentionable), inline: true },
            { name: 'Action', value: 'Role Deleted', inline: true },
            { name: 'Deleted By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f25252')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: guild.name, iconURL: guild.iconURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Role', value: `${role.name}`, inline: true },
            { name: 'ID', value: role.id, inline: true },
            { name: 'Color', value: role.hexColor, inline: true },
            { name: 'Hoisted', value: capitalize(role.hoist), inline: true },
            { name: 'Mentionable', value: capitalize(role.mentionable), inline: true },
            { name: 'Action', value: 'Role Deleted', inline: true },
            { name: 'Deleted By', value: executor, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'role', 'Role Deleted', 0xf25252, fields, row.channel_id, sent.id, guild.iconURL(), guild.name)
        }).catch(() => {})
      }
    )
  })
}
