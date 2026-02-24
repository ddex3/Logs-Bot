const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('privacy')
    .setDescription('View the bot\'s privacy policy'),

  async execute(interaction) {
    const bot = interaction.client.user

    const embed = new EmbedBuilder()
      .setTitle('Privacy Policy')
      .setDescription('We value your privacy. You can view our full policy and terms at the link below.')
      .setColor('#007bff')
      .setThumbnail(bot.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${bot.username} • Privacy`, iconURL: bot.displayAvatarURL() })
      .setTimestamp()

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('View Privacy Policy')
        .setStyle(ButtonStyle.Link)
        .setURL('https://logsbot.com/privacy')
    )

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true })
  }
}
