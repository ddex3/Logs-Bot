const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ComponentType
} = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-settings')
    .setDescription('Reset all log settings for this server'),

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

    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_reset')
        .setLabel('Yes')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_reset')
        .setLabel('No')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription('Are you sure you want to reset all log settings for this server?')
          .setColor('#ffcc00')
      ],
      components: [confirmRow],
      ephemeral: true
    });

    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30_000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on('collect', async i => {
      if (i.customId === 'cancel_reset') {
        await i.update({
          embeds: [
            new EmbedBuilder()
              .setDescription('Reset cancelled. No changes were made.')
              .setColor('#f25252')
          ],
          components: [],
          ephemeral: true
        });
        collector.stop();
        return;
      }

      if (i.customId === 'confirm_reset') {
        const guildId = interaction.guild.id;
        const dbPath = path.join(__dirname, '..', 'Data', 'logsChannels.db');
        const db = new sqlite3.Database(dbPath);

        db.run(`DELETE FROM logs_channels WHERE guild_id = ?`, [guildId], err => {
          db.close();

          if (err) {
            return i.update({
              embeds: [
                new EmbedBuilder()
                  .setDescription('Failed to reset settings. Please try again later.')
                  .setColor('#f25252')
              ],
              components: [],
              ephemeral: true
            });
          }

          return i.update({
            embeds: [
              new EmbedBuilder()
                .setDescription('All log settings for this server have been successfully reset.')
                .setColor('#57F287')
            ],
            components: [],
            ephemeral: true
          });
        });

        collector.stop();
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setDescription('No response received. Reset cancelled.')
              .setColor('#f25252')
          ],
          components: [],
          ephemeral: true
        });
      }
    });
  }
};
