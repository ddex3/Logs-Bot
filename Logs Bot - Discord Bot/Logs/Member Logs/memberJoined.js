const { EmbedBuilder } = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const { saveServerLog } = require('../../Systems/savelogs')

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'logsChannels.db')

  const db = new sqlite3.Database(dbPath)

  const invitesCache = new Map()

  client.on('inviteCreate', invite => {
    const guildInvites = invitesCache.get(invite.guild.id) || new Map()
    guildInvites.set(invite.code, invite.uses)
    invitesCache.set(invite.guild.id, guildInvites)
  })

  client.on('inviteDelete', invite => {
    const guildInvites = invitesCache.get(invite.guild.id)
    if (guildInvites) {
      guildInvites.delete(invite.code)
      invitesCache.set(invite.guild.id, guildInvites)
    }
  })

  client.on('guildMemberAdd', async member => {
    const guild = member.guild
    const timestamp = Math.floor(Date.now() / 1000)
    const createdAt = member.user.createdAt
    const now = new Date()

    let years = now.getFullYear() - createdAt.getFullYear()
    let months = now.getMonth() - createdAt.getMonth()
    let days = now.getDate() - createdAt.getDate()

    if (days < 0) {
      months -= 1
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate()
    }
    if (months < 0) {
      years -= 1
      months += 12
    }

    const ageText = `**${years}** years, **${months}** months, **${days}** days`

    const newInvites = await guild.invites.fetch().catch(() => null)
    let usedInvite = 'Unknown'

    if (newInvites) {
      const cachedInvites = invitesCache.get(guild.id)
      for (const invite of newInvites.values()) {
        const prevUses = cachedInvites?.get(invite.code) || 0
        if (invite.uses > prevUses) {
          usedInvite = invite.code
          break
        }
      }

      const guildInvites = new Map()
      newInvites.forEach(i => guildInvites.set(i.code, i.uses))
      invitesCache.set(guild.id, guildInvites)
    }

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Member Joined'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Member Joined')
          .addFields(
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Invite Code', value: usedInvite, inline: true },
            { name: 'Account Age', value: ageText, inline: false },
            { name: 'Created At', value: `<t:${Math.floor(createdAt.getTime() / 1000)}>`, inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#67e68d')
          .setThumbnail(member.user.displayAvatarURL())
          .setFooter({ text: `${guild.client.user.username} • Member Joined`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Invite Code', value: usedInvite, inline: true },
            { name: 'Account Age', value: ageText, inline: false },
            { name: 'Created At', value: `<t:${Math.floor(createdAt.getTime() / 1000)}>`, inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'member', 'Member Joined', 0x67e68d, fields, row.channel_id, sent.id, member.user.displayAvatarURL(), `${guild.client.user.username} • Member Joined`)
        }).catch(() => {})
      }
    )
  })

  client.on('ready', async () => {
    for (const [guildId, guild] of client.guilds.cache) {
      const invites = await guild.invites.fetch().catch(() => null)
      if (invites) {
        const inviteMap = new Map()
        invites.forEach(invite => inviteMap.set(invite.code, invite.uses))
        invitesCache.set(guildId, inviteMap)
      }
    }
  })
}
