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
    if (!oldState.streaming || newState.streaming) return
    const guild = newState.guild
    if (!guild) return

    const member = newState.member
    const channel = oldState.channel
    const timestamp = Math.floor(Date.now() / 1000)

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Stopped Streaming'",
      [guild.id],
      (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle('Stopped Streaming')
          .addFields(
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Channel', value: channel ? `<#${channel.id}> (${channel.name})` : 'None', inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor('#f25252')
          .setThumbnail(guild.iconURL())
          .setFooter({ text: `${guild.client.user.username} • Stopped Streaming`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Channel', value: channel ? `<#${channel.id}> (${channel.name})` : 'None', inline: true },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          saveServerLog(guild.id, 'voice', 'Stopped Streaming', 0xf25252, fields, row.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • Stopped Streaming`)
        }).catch(() => {})
      }
    )
  })
}
