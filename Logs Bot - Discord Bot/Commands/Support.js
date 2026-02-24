const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const config = require('../config')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Get support server and website links'),

  async execute(interaction) {
    const bot = interaction.client.user

    const embed = new EmbedBuilder()
      .setTitle('Need Help? We\'re Here!')
      .setDescription('Click one of the buttons below to visit our support server or official website.')
      .setColor('#007bff')
      .setThumbnail(bot.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Logs Bot • Support & Links`, iconURL: bot.displayAvatarURL() })
      .setTimestamp()

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Support Server')
        .setStyle(ButtonStyle.Link)
        .setURL(config.SUPPORT_SERVER_URL),

      new ButtonBuilder()
        .setLabel('Our Website')
        .setStyle(ButtonStyle.Link)
        .setURL(config.WEBSITE_URL)
    )

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true })
  }
}
