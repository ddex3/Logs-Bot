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
    const guild = newState.guild
    if (!guild || oldState.channelId === newState.channelId) return

    const member = newState.member
    const timestamp = Math.floor(Date.now() / 1000)
    const oldChannel = oldState.channel
    const newChannel = newState.channel

    let actionType = ''
    let color = ''
    let channelName = ''

    if (!oldChannel && newChannel) {
      actionType = 'Joined Voice Channel'
      color = '#67e68d'
      channelName = `<#${newChannel.id}> (${newChannel.name})`
    } else if (oldChannel && !newChannel) {
      actionType = 'Left Voice Channel'
      color = '#f25252'
      channelName = `<#${oldChannel.id}> (${oldChannel.name})`
    } else if (oldChannel && newChannel) {
      actionType = 'Switched Voice Channel'
      color = '#f2c852'
      channelName = `From <#${oldChannel.id}> (${oldChannel.name}) to <#${newChannel.id}> (${newChannel.name})`
    } else return

    db.get(
      "SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Voice State Updated'",
      [guild.id],
      (_, row) => {
        if (!row) return
        const logChannel = guild.channels.cache.get(row.channel_id)
        if (!logChannel) return

        const embed = new EmbedBuilder()
          .setTitle(actionType)
          .addFields(
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Channel', value: channelName, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          )
          .setColor(color)
          .setThumbnail(guild.iconURL())
          .setFooter({ text: `${guild.client.user.username} • ${actionType}`, iconURL: guild.client.user.displayAvatarURL() })
          .setTimestamp()

        logChannel.send({ embeds: [embed] }).then(sent => {
          const fields = [
            { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Channel', value: channelName, inline: false },
            { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
          ]
          const colorInt = actionType === 'Joined Voice Channel' ? 0x67e68d : actionType === 'Left Voice Channel' ? 0xf25252 : 0xf2c852
          saveServerLog(guild.id, 'voice', actionType, colorInt, fields, row.channel_id, sent.id, guild.iconURL(), `${guild.client.user.username} • ${actionType}`)
        }).catch(() => {})
      }
    )
  })
}
