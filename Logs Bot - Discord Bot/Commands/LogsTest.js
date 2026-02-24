const {
  SlashCommandBuilder,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs-test')
    .setDescription('Send a test log (Member Joined)')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Select the log channel')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Administrator),

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
    const channel = interaction.options.getChannel('channel');
    const botUser = interaction.client.user;

    const now = new Date();
    const createdAt = botUser.createdAt;
    const timestamp = Math.floor(Date.now() / 1000);

    let years = now.getFullYear() - createdAt.getFullYear();
    let months = now.getMonth() - createdAt.getMonth();
    let days = now.getDate() - createdAt.getDate();

    if (days < 0) {
      months -= 1;
      days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const ageText = `**${years}** years, **${months}** months, **${days}** days`;

    const embed = new EmbedBuilder()
      .setTitle('Member Joined')
      .addFields(
        { name: 'User', value: `<@${botUser.id}> (${botUser.tag})`, inline: true },
        { name: 'ID', value: botUser.id, inline: true },
        { name: 'Invite Code', value: 'BOT-TEST', inline: true },
        { name: 'Account Age', value: ageText, inline: false },
        { name: 'Created At', value: `<t:${Math.floor(createdAt.getTime() / 1000)}>`, inline: true },
        { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
      )
      .setColor('#67e68d')
      .setThumbnail(botUser.displayAvatarURL())
      .setFooter({ text: `${botUser.username} • Member Joined`, iconURL: botUser.displayAvatarURL() })
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`A test log was sent to ${channel}.`)
          .setColor('#57F287')
      ],
      ephemeral: true
    });
  }
};