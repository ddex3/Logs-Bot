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
    if (!newMember.guild) return
    const guild = newMember.guild
    if (oldMember.avatar === newMember.avatar) return

    const timestamp = Math.floor(Date.now() / 1000)

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Avatar Changed'",
      [guild.id],
      async (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Member Avatar Changed')
          .addFields(
            { name: 'User', value: `<@${newMember.id}> (${newMember.user.tag})`, inline: false },
            { name: 'Avatar (Before)', value: oldMember.avatar ? `[View](${oldMember.displayAvatarURL({ dynamic: true })})` : 'None', inline: true },
            { name: 'Avatar (After)', value: newMember.avatar ? `[View](${newMember.displayAvatarURL({ dynamic: true })})` : 'None', inline: true },
            { name: 'Action', value: 'Avatar Changed', inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f2c852')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: guild.name, iconURL: guild.iconURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'User', value: `<@${newMember.id}> (${newMember.user.tag})`, inline: false },
            { name: 'Avatar (Before)', value: oldMember.avatar ? `[View](${oldMember.displayAvatarURL({ dynamic: true })})` : 'None', inline: true },
            { name: 'Avatar (After)', value: newMember.avatar ? `[View](${newMember.displayAvatarURL({ dynamic: true })})` : 'None', inline: true },
            { name: 'Action', value: 'Avatar Changed', inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'user', 'Avatar Changed', 0xf2c852, fields, row.channel_id, sent.id, guild.iconURL(), guild.name)
        }).catch(() => {})
      }
    )
  })
}
