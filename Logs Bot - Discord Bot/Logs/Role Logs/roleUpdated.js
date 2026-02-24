const { EmbedBuilder, AuditLogEvent, PermissionsBitField } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')

  const db = new sqlite3.Database(dbPath)

  client.on('roleUpdate', async (oldRole, newRole) => {
    const guild = newRole.guild
    const timestamp = Math.floor(Date.now() / 1000)
    const changes = []

    const capitalize = val => val.toString().charAt(0).toUpperCase() + val.toString().slice(1)

    if (oldRole.name !== newRole.name) {
      changes.push({ name: 'Name (Before)', value: oldRole.name, inline: true })
      changes.push({ name: 'Name (After)', value: newRole.name, inline: true })
    }

    if (oldRole.color !== newRole.color) {
      changes.push({ name: 'Color (Before)', value: oldRole.hexColor, inline: true })
      changes.push({ name: 'Color (After)', value: newRole.hexColor, inline: true })
    }

    if (oldRole.hoist !== newRole.hoist) {
      changes.push({ name: 'Online Display (Before)', value: capitalize(oldRole.hoist), inline: true })
      changes.push({ name: 'Online Display (After)', value: capitalize(newRole.hoist), inline: true })
    }

    if (oldRole.mentionable !== newRole.mentionable) {
      changes.push({ name: 'Mentionable (Before)', value: capitalize(oldRole.mentionable), inline: true })
      changes.push({ name: 'Mentionable (After)', value: capitalize(newRole.mentionable), inline: true })
    }

    const oldPerms = new PermissionsBitField(oldRole.permissions)
    const newPerms = new PermissionsBitField(newRole.permissions)

    const removed = oldPerms.toArray().filter(p => !newPerms.has(p))
    const added = newPerms.toArray().filter(p => !oldPerms.has(p))

    if (removed.length > 0) {
      changes.push({ name: 'Permissions Removed', value: removed.join(', '), inline: false })
    }

    if (added.length > 0) {
      changes.push({ name: 'Permissions Added', value: added.join(', '), inline: false })
    }

    if (!changes.length) return

    const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 1 })
    const entry = logs.entries.find(e => e.target.id === newRole.id)
    const executor = entry?.executor
      ? `<@${entry.executor.id}> (${entry.executor.tag})`
      : 'Unknown'

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Role Updated'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Role Updated')
          .addFields(
            { name: 'Role', value: `${newRole.name} (<@&${newRole.id}>)`, inline: false },
            { name: 'Action', value: 'Role Updated', inline: true },
            { name: 'Updated By', value: executor, inline: false },
            ...changes,
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f2c852')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: guild.name, iconURL: guild.iconURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Role', value: `${newRole.name} (<@&${newRole.id}>)`, inline: false },
            { name: 'Action', value: 'Role Updated', inline: true },
            { name: 'Updated By', value: executor, inline: false },
            ...changes,
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'role', 'Role Updated', 0xf2c852, fields, row.channel_id, sent.id, guild.iconURL(), guild.name)
        }).catch(() => {})
      }
    )
  })
}
