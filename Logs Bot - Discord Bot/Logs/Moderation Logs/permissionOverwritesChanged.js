const { EmbedBuilder, AuditLogEvent, PermissionFlagsBits } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = client => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const db = new sqlite3.Database(path.join(dataDir, 'logsChannels.db'))

  client.on('channelUpdate', async (oldChannel, newChannel) => {
    const guild = newChannel.guild
    const timestamp = Math.floor(Date.now() / 1000)

    const oldPerms = oldChannel.permissionOverwrites.cache
    const newPerms = newChannel.permissionOverwrites.cache
    const allTargets = new Set([...oldPerms.keys(), ...newPerms.keys()])
    const changes = []

    for (const id of allTargets) {
      const oldOverwrite = oldPerms.get(id)
      const newOverwrite = newPerms.get(id)

      if (!oldOverwrite && newOverwrite) {
        const name = await resolveName(guild, id)
        changes.push(`**Added Permissions** → ${name}`)
        continue
      }

      if (oldOverwrite && !newOverwrite) {
        const name = await resolveName(guild, id)
        changes.push(`**Removed Permissions** → ${name}`)
        continue
      }

      const diff = []
      for (const perm of Object.keys(PermissionFlagsBits)) {
        const oldAllow = oldOverwrite.allow.has(PermissionFlagsBits[perm])
        const oldDeny = oldOverwrite.deny.has(PermissionFlagsBits[perm])
        const newAllow = newOverwrite.allow.has(PermissionFlagsBits[perm])
        const newDeny = newOverwrite.deny.has(PermissionFlagsBits[perm])

        if (oldAllow !== newAllow || oldDeny !== newDeny) {
          diff.push(`• \`${perm}\` - ${formatState(oldAllow, oldDeny)} → ${formatState(newAllow, newDeny)}`)
        }
      }

      if (diff.length > 0) {
        const name = await resolveName(guild, id)
        changes.push(`**Updated Permissions** → ${name}\n${diff.join('\n')}`)
      }
    }

    if (!changes.length) return

    let executor = 'Unknown'
    let executorId = 'Unknown'
    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelOverwriteUpdate, limit: 1 })
      const entry = logs.entries.first()
      if (entry) {
        executor = `<@${entry.executor.id}> (${entry.executor.tag})`
        executorId = entry.executor.id
      }
    } catch {}

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Permission Overwrites Changed'",
      [guild.id],
      (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Permission Overwrites Changed')
          .addFields(
            { name: 'Channel', value: `<#${newChannel.id}> (${newChannel.name})`, inline: true },
            { name: 'Changed By', value: `${executor}`, inline: true },
            { name: 'ID', value: `${executorId}`, inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: true },
            { name: 'Changes', value: `${changes.slice(0, 5).join('\n\n').slice(0, 1024)}`, inline: false }
          )
          .setColor('#f2c852')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: `${client.user.username} • Permission Overwrites Changed`, iconURL: client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'Channel', value: `<#${newChannel.id}> (${newChannel.name})`, inline: true },
            { name: 'Changed By', value: `${executor}`, inline: true },
            { name: 'ID', value: `${executorId}`, inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: true },
            { name: 'Changes', value: `${changes.slice(0, 5).join('\n\n').slice(0, 1024)}`, inline: false }
          ]
          saveServerLog(guild.id, 'moderation', 'Permission Overwrites Changed', 0xf2c852, fields, row.channel_id, sent.id, guild.iconURL(), `${client.user.username} • Permission Overwrites Changed`)
        }).catch(() => {})
      }
    )
  })

  async function resolveName(guild, id) {
    const role = guild.roles.cache.get(id)
    if (role) return `Role: <@&${role.id}> (\`${role.name}\`)`
    const member = await guild.members.fetch(id).catch(() => null)
    if (member) return `User: \`${member.user.tag}\``
    return `Unknown (ID: ${id})`
  }

  function formatState(allow, deny) {
    if (allow) return 'Allow'
    if (deny) return 'Deny'
    return 'Unset'
  }
}
