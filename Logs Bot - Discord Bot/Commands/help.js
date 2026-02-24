const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View bot information and available commands'),

  async execute(interaction) {
    await interaction.deferReply();

    const pages = [];

    const uptime = (() => {
      const totalSeconds = Math.floor(interaction.client.uptime / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const seconds = totalSeconds % 60;
      return `**${days}** days, **${hours}** hours, **${seconds}** seconds`;
    })();

    const createdAt = (() => {
      const now = Date.now();
      const created = interaction.client.user.createdTimestamp;
      const diff = Math.floor((now - created) / 1000);
      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      return `**${days}** days, **${hours}** hours ago`;
    })();

    const colors = ['#1e3a8a', '#1e40af'];

    const infoEmbed = new EmbedBuilder()
      .setTitle('Logs Bot • General Information')
      .setColor(colors[0])
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Developers', value: '`@de_x3` & `@coders1_1.`', inline: true },
        { name: 'Created On', value: createdAt, inline: true },
        { name: 'Current Ping', value: `**${interaction.client.ws.ping}** ms`, inline: true },
        { name: 'Uptime', value: uptime, inline: true },
        { name: 'Connected Servers', value: `${interaction.client.guilds.cache.size}`, inline: true },
        {
          name: 'Important Links',
          value: [
            `[Invite Bot](${config.WEBSITE_URL}/invite)`,
            `[Support Server](${config.SUPPORT_SERVER_URL})`,
            `[Official Website](${config.WEBSITE_URL})`
          ].join(' | ')
        }
      )
      .setFooter({ text: 'Page 1 of 2', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    const commandsEmbed = new EmbedBuilder()
      .setTitle('Logs Bot • Available Commands')
      .setColor(colors[1])
      .setDescription([
        '**General Commands**',
        '`/help` – Display bot information and this command list.',
        '`/invite` – Get the bot\'s invite link.',
        '`/support` – Get support server and website links.',
        '`/vote` – Vote for the bot and help us grow!',
        '',
        '**Log Configuration**',
        '`/set-logs` – Assign log types to channels.',
        '`/settings` – Show log settings.',
        '`/disable-logs` – Disable a specific log.',
        '`/reset-settings` – Reset all log settings for this server.',
        '`/logs-test` – Send a test log (Member Joined).',
        '',
        '**Legal & Information**',
        '`/legal` – View the bot\'s Legal Policy\'s.',
        '`/privacy` – View the bot\'s privacy policy.',
        '`/terms` – View the bot\'s terms of use.'
      ].join('\n'))
      .setFooter({ text: 'Page 2 of 2', iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    pages.push(infoEmbed, commandsEmbed);

    let currentPage = 0;

    const getButtons = () =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('← Back')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next →')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(currentPage === pages.length - 1),
        new ButtonBuilder()
          .setCustomId('more')
          .setLabel('More Info')
          .setStyle(ButtonStyle.Secondary)
      );

    const msg = await interaction.editReply({
      embeds: [pages[currentPage]],
      components: [getButtons()]
    });

    const collector = msg.createMessageComponentCollector({ time: 5 * 60 * 1000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setDescription('<:x_:1461360618266296351> **You cannot use this buttons. Use `/help` yourself to get bot information.**')
              .setColor('#f25252')
          ]
        });
      }

      if (i.customId === 'more') {
        return i.reply({
          ephemeral: true,
          embeds: [
            new EmbedBuilder()
              .setTitle('Logs Bot • Getting Started')
              .setDescription('To get started, use `/set-logs` to select a logging channel.\nThen explore all commands in `/help`.\nNeed more support? Join our support server.')
              .setColor('#4b5563')
              .setFooter({
                text: 'Logs Bot • More Information',
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
              })
              .setTimestamp()
          ]
        });
      }

      if (i.customId === 'next' && currentPage < pages.length - 1) currentPage++;
      else if (i.customId === 'prev' && currentPage > 0) currentPage--;

      await i.update({
        embeds: [pages[currentPage]],
        components: [getButtons()]
      });
    });

    collector.on('end', async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('← Back')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next →')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('more')
          .setLabel('More Info')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
      await msg.edit({ components: [disabledRow] });
    });
  }
};
