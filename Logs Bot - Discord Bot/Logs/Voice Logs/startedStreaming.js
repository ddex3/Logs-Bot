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

  client.on('voiceStateUpdate', async (oldState, newState) => {
    if (!newState.streaming || oldState.streaming) return
    const guild = newState.guild
    if (!guild) return

    const member = newState.member
    const channel = newState.channel
    const timestamp = Math.floor(Date.now() / 1000)

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Started Streaming'",
      [guild.id],
      (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Started Streaming')
          .addFields(
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Channel', value: channel ? `<#${channel.id}> (${channel.name})` : 'None', inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#67e68d')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: `${guild.client.user.username} • Started Streaming`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Channel', value: channel ? `<#${channel.id}> (${channel.name})` : 'None', inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'voice', 'Started Streaming', 0x67e68d, fields, row.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • Started Streaming`)
        }).catch(() => {})
      }
    )
  })
}
