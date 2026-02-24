const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ComponentType,
  PermissionsBitField
} = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const categories = [
  { name: 'Member Logs', key: 'member' },
  { name: 'User Logs', key: 'user' },
  { name: 'Moderation & Security Logs', key: 'moderation' },
  { name: 'Role Logs', key: 'role' },
  { name: 'Channel Logs', key: 'channel' },
  { name: 'Message Logs', key: 'message' },
  { name: 'Invite Logs', key: 'invite' },
  { name: 'Voice Logs', key: 'voice' },
  { name: 'Webhook & Stage Logs', key: 'webhook' },
  { name: 'Scheduled Event Logs', key: 'scheduled' },
  { name: 'Emoji & Sticker Logs', key: 'emoji' },
  { name: 'Nitro & Boost Logs', key: 'nitro' }
];

function logsFor(category) {
  switch (category) {
    case 'member': return ['Member Joined', 'Member Left', 'Member Updated', 'Nickname Changed'];
    case 'user': return ['Username Changed', 'Avatar Changed'];
    case 'moderation': return ['Member Banned', 'Ban Removed', 'Timeout Applied', 'Timeout Removed', 'Member Kicked', 'Presence Updated', 'Permission Overwrites Changed', 'Bot Added to Server', 'Bot Removed from Server'];
    case 'role': return ['Role Created', 'Role Deleted', 'Role Updated'];
    case 'channel': return ['Channel Created', 'Channel Deleted', 'Channel Updated', 'Thread Created', 'Thread Updated', 'Thread Deleted', 'AFK Channel Changed', 'System Messages Channel Changed'];
    case 'message': return ['Message Sent', 'Message Edited', 'Message Deleted', 'Bulk Message Deleted'];
    case 'invite': return ['Invite Created', 'Invite Deleted'];
    case 'voice': return ['Voice State Updated', 'Started Streaming', 'Stopped Streaming', 'Started Video', 'Stopped Video', 'Self Muted', 'Self Unmuted', 'Self Deafened', 'Self Undeafened', 'Server Muted', 'Server Unmuted', 'Server Deafened', 'Server Undeafened'];
    case 'webhook': return ['Webhook Updated', 'Stage Started', 'Stage Updated', 'Stage Ended'];
    case 'scheduled': return ['Scheduled Event Created', 'Scheduled Event Updated', 'Scheduled Event Deleted', 'Scheduled Event Started', 'Scheduled Event Ended', 'Event Subscription Added', 'Event Subscription Removed'];
    case 'emoji': return ['Emoji Created', 'Emoji Updated', 'Emoji Deleted', 'Sticker Created', 'Sticker Updated', 'Sticker Deleted'];
    case 'nitro': return ['Server Boosted', 'Server Boost Removed', 'Boost Tier Changed'];
    default: return [];
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disable-logs')
    .setDescription('Disable a specific log'),

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
    const categoryMenu = new StringSelectMenuBuilder()
      .setCustomId('select_category')
      .setPlaceholder('Select a log category')
      .addOptions(
        categories.map(cat => ({
          label: cat.name,
          value: cat.key
        }))
      );

    const row = new ActionRowBuilder().addComponents(categoryMenu);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription('Choose a log category to disable:')
          .setColor('#007bff')
      ],
      components: [row],
      ephemeral: true
    });

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 30_000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on('collect', async i => {
      if (i.customId !== 'select_category') return;

      const selectedKey = i.values[0];
      const logs = logsFor(selectedKey);

      await i.deferUpdate();

      const logMenu = new StringSelectMenuBuilder()
        .setCustomId('select_log')
        .setPlaceholder('Select a log to disable')
        .addOptions(logs.map(l => ({ label: l, value: l })));

      const logRow = new ActionRowBuilder().addComponents(logMenu);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(`Choose a log to disable from **${categories.find(c => c.key === selectedKey).name}**:`)
            .setColor('#007bff')
        ],
        components: [logRow],
        ephemeral: true
      });

      const logCollector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 30_000,
        filter: x => x.user.id === interaction.user.id
      });

      logCollector.on('collect', async selectInteraction => {
        if (selectInteraction.customId !== 'select_log') return;

        const selectedLog = selectInteraction.values[0];
        const guildId = interaction.guild.id;
        const dbPath = path.join(__dirname, '..', 'Data', 'logsChannels.db');
        const db = new sqlite3.Database(dbPath);

        await selectInteraction.deferUpdate();

        db.get('SELECT * FROM logs_channels WHERE guild_id = ? AND log = ?', [guildId, selectedLog], (err, row) => {
          if (err) {
            db.close();
            return interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setDescription('Error reading from the database.')
                  .setColor('#f25252')
              ],
              components: [new ActionRowBuilder().addComponents(selectInteraction.component)],
              ephemeral: true
            });
          }

          if (!row) {
            db.close();
            return interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(`The log **${selectedLog}** is not enabled.`)
                  .setColor('#f25252')
              ],
              components: [new ActionRowBuilder().addComponents(selectInteraction.component)],
              ephemeral: true
            });
          }

          db.run('DELETE FROM logs_channels WHERE guild_id = ? AND log = ?', [guildId, selectedLog], err => {
            db.close();
            if (err) {
              return interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setDescription('Failed to disable the log.')
                    .setColor('#f25252')
                ],
                components: [new ActionRowBuilder().addComponents(selectInteraction.component)],
                ephemeral: true
              });
            }

            return interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setDescription(`The log **${selectedLog}** has been disabled.`)
                  .setColor('#57F287')
              ],
              components: [],
              ephemeral: true
            });
          });
        });
      });
    });
  }
};
