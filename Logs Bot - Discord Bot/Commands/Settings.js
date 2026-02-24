const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  ComponentType,
  ChannelType,
  PermissionsBitField
} = require('discord.js')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, '..', 'Data', 'logsChannels.db')
const ON = '<:on:1386392067114008707>'
const OFF = '<:off:1386392079130824744>'
const GEAR = '<:settings:1386450972338815046>'

const categories = [
  { name: 'Member Logs', logs: ['Member Joined', 'Member Left', 'Member Updated', 'Nickname Changed'] },
  { name: 'User Logs', logs: ['Username Changed', 'Avatar Changed'] },
  { name: 'Moderation & Security Logs', logs: ['Member Banned', 'Ban Removed', 'Timeout Applied', 'Timeout Removed', 'Member Kicked', 'Presence Updated', 'Permission Overwrites Changed', 'Bot Added to Server', 'Bot Removed from Server'] },
  { name: 'Role Logs', logs: ['Role Created', 'Role Deleted', 'Role Updated'] },
  { name: 'Channel Logs', logs: ['Channel Created', 'Channel Deleted', 'Channel Updated', 'Thread Created', 'Thread Updated', 'Thread Deleted', 'AFK Channel Changed', 'System Messages Channel Changed'] },
  { name: 'Message Logs', logs: ['Message Sent', 'Message Edited', 'Message Deleted', 'Bulk Message Deleted'] },
  { name: 'Invite Logs', logs: ['Invite Created', 'Invite Deleted'] },
  { name: 'Voice Logs', logs: ['Voice State Updated', 'Started Streaming', 'Stopped Streaming', 'Started Video', 'Stopped Video', 'Self Muted', 'Self Unmuted', 'Self Deafened', 'Self Undeafened', 'Server Muted', 'Server Unmuted', 'Server Deafened', 'Server Undeafened'] },
  { name: 'Webhook & Stage Logs', logs: ['Webhook Updated', 'Stage Started', 'Stage Updated', 'Stage Ended'] },
  { name: 'Scheduled Event Logs', logs: ['Scheduled Event Created', 'Scheduled Event Updated', 'Scheduled Event Deleted', 'Scheduled Event Started', 'Scheduled Event Ended', 'Event Subscription Added', 'Event Subscription Removed'] },
  { name: 'Emoji & Sticker Logs', logs: ['Emoji Created', 'Emoji Updated', 'Emoji Deleted', 'Sticker Created', 'Sticker Updated', 'Sticker Deleted'] },
  { name: 'Nitro & Boost Logs', logs: ['Server Boosted', 'Server Boost Removed', 'Boost Tier Changed'] }
]

function pageEmbed(i, map, client) {
  const body = categories[i].logs.map(l => map.has(l) ? `${ON} ${l} <#${map.get(l)}>` : `${OFF} ${l}`).join('\n')
  return new EmbedBuilder().setTitle(`(${i + 1}) ${categories[i].name}`).setDescription(body).setThumbnail(client.user.displayAvatarURL()).setColor('#007bff').setFooter({ text: `Logs Bot • Settings • Page ${i + 1}`, iconURL: client.user.displayAvatarURL() }).setTimestamp()
}
function overviewEmbed(map, client) {
  const body = categories.map(c =>
    c.logs.every(l => map.has(l))
      ? `${ON} ${c.name}`
      : `${OFF} ${c.name}`
  ).join('\n')

  return new EmbedBuilder()
    .setTitle('Categories Overview')
    .setDescription(body)
    .setThumbnail(client.user.displayAvatarURL())
    .setColor('#007bff')
    .setTimestamp()
}

function logEmbed(l, map, client) {
  const txt = map.has(l) ? `Channel: <#${map.get(l)}>` : 'No channel configured'
  return new EmbedBuilder().setTitle(l).setDescription(txt).setThumbnail(client.user.displayAvatarURL()).setColor('#007bff').setTimestamp()
}
function pendingEmbed(l, ch, client) {
  return new EmbedBuilder().setTitle(l).setDescription(`Selected channel: <#${ch}>\nPress Confirm to save`).setThumbnail(client.user.displayAvatarURL()).setColor('#007bff').setTimestamp()
}
function navRow(i) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('first').setLabel('⇤').setStyle(ButtonStyle.Secondary).setDisabled(i === 0),
    new ButtonBuilder().setCustomId('prev').setLabel('←').setStyle(ButtonStyle.Success).setDisabled(i === 0),
    new ButtonBuilder().setCustomId('overview').setEmoji(GEAR).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('next').setLabel('→').setStyle(ButtonStyle.Success).setDisabled(i === categories.length - 1),
    new ButtonBuilder().setCustomId('last').setLabel('⇥').setStyle(ButtonStyle.Secondary).setDisabled(i === categories.length - 1)
  )
}
function categoryMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId('cat').setPlaceholder('Select category').setOptions(categories.map((c, i) => ({ label: c.name, value: String(i) })))
  )
}
function logsMenu(i) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId(`log_${i}`).setPlaceholder('Select log').setOptions(categories[i].logs.map(l => ({ label: l, value: l })))
  )
}
function chooseRow(l, cfg) {
  const label = cfg ? 'Change Channel' : 'Choose Channel'
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`sel_${l}`).setLabel(label).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('back').setLabel('Back').setStyle(ButtonStyle.Secondary)
  )
}
function confirmRow(l) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ok_${l}`).setLabel('Confirm').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('back').setLabel('Back').setStyle(ButtonStyle.Secondary)
  )
}
function channelMenu(l) {
  return new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder().setCustomId(`chan_${l}`).setPlaceholder('Choose channel').setMinValues(1).setMaxValues(1).addChannelTypes(ChannelType.GuildText)
  )
}

module.exports = {
  data: new SlashCommandBuilder().setName('settings').setDescription('Show log settings'),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription('You must have **Administrator** permission to use this command.')
            .setColor('#f25252')
        ],
        ephemeral: true
      });
    }
    const db = new sqlite3.Database(dbPath)
    db.all('SELECT log,channel_id FROM logs_channels WHERE guild_id=?', [interaction.guild.id], async (err, rows) => {
      if (err) { console.error(err); return interaction.reply({ content: 'Database error', ephemeral: true }) }
      const map = new Map(rows.map(r => [r.log, r.channel_id]))
      const pending = new Map()
      let page = 0, state = 'page', cat = 0, log = ''
      await interaction.reply({ embeds: [pageEmbed(page, map, interaction.client)], components: [navRow(page)], ephemeral: true })
      const msg = await interaction.fetchReply()
      const col = msg.createMessageComponentCollector({ time: 900000 })
      col.on('collect', async c => {
        if (c.user.id !== interaction.user.id) { await c.deferUpdate(); return }
        try {
          if (c.isButton()) {
            const id = c.customId
            if (state === 'page' && ['first', 'prev', 'next', 'last'].includes(id)) {
              if (id === 'first') page = 0
              if (id === 'prev') page--
              if (id === 'next') page++
              if (id === 'last') page = categories.length - 1
              await c.update({ embeds: [pageEmbed(page, map, interaction.client)], components: [navRow(page)] })
              return
            }
            if (id === 'overview') {
              state = 'overview'
              await c.update({ embeds: [overviewEmbed(map, interaction.client)], components: [categoryMenu(), new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back').setLabel('Back').setStyle(ButtonStyle.Secondary))] })
              return
            }
            if (id === 'back') {
              if (state === 'overview' || state === 'page') { state = 'page'; await c.update({ embeds: [pageEmbed(page, map, interaction.client)], components: [navRow(page)] }); return }
              if (state === 'category') { state = 'overview'; await c.update({ embeds: [overviewEmbed(map, interaction.client)], components: [categoryMenu(), new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back').setLabel('Back').setStyle(ButtonStyle.Secondary))] }); return }
              if (state === 'log') { state = 'category'; await c.update({ embeds: [pageEmbed(cat, map, interaction.client)], components: [logsMenu(cat), chooseRow(log, map.has(log))] }); return }
              if (state === 'select' || state === 'pending') {
                state = 'log'
                await c.update({ embeds: [logEmbed(log, map, interaction.client)], components: [chooseRow(log, map.has(log))] })
                return
              }
            }
            if (id.startsWith('sel_')) {
              log = id.slice(4)
              state = 'select'
              await c.update({ embeds: [logEmbed(log, map, interaction.client)], components: [channelMenu(log), new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back').setLabel('Back').setStyle(ButtonStyle.Secondary))] })
              return
            }
            if (id.startsWith('ok_')) {
              log = id.slice(3)
              if (!pending.has(log)) { await c.deferUpdate(); return }
              const ch = pending.get(log)
              db.run('REPLACE INTO logs_channels (guild_id,log,channel_id) VALUES (?,?,?)', [interaction.guild.id, log, ch], e => e && console.error(e))
              map.set(log, ch)
              pending.delete(log)
              state = 'page'
              page = 0
              await c.update({ embeds: [pageEmbed(page, map, interaction.client)], components: [navRow(page)] })
              return
            }
          }
          if (c.isStringSelectMenu()) {
            const id = c.customId
            if (id === 'cat') {
              cat = parseInt(c.values[0])
              state = 'category'
              await c.update({ embeds: [pageEmbed(cat, map, interaction.client)], components: [logsMenu(cat), new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('back').setLabel('Back').setStyle(ButtonStyle.Secondary))] })
              return
            }
            if (id.startsWith('log_')) {
              log = c.values[0]
              state = 'log'
              await c.update({ embeds: [logEmbed(log, map, interaction.client)], components: [chooseRow(log, map.has(log))] })
              return
            }
          }
          if (c.isChannelSelectMenu()) {
            const id = c.customId
            if (id.startsWith('chan_')) {
              log = id.slice(5)
              const ch = c.values[0]
              pending.set(log, ch)
              state = 'pending'
              await c.update({ embeds: [pendingEmbed(log, ch, interaction.client)], components: [confirmRow(log)] })
            }
          }
        } catch (e) { console.error(e) }
      })
    })
  }
}
