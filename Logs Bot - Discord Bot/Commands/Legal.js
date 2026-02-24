const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const config = require('../config')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legal')
    .setDescription('View the bot\'s Leagal Policy\'s'),

  async execute(interaction) {
    const bot = interaction.client.user

    const embed = new EmbedBuilder()
      .setTitle('Legal Information')
      .setDescription('You can view our Terms of Use and Privacy Policy using the buttons below.')
      .setColor('#007bff')
      .setThumbnail(bot.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${bot.username} • Legal`, iconURL: bot.displayAvatarURL() })
      .setTimestamp()

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Terms of Use')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.WEBSITE_URL}/terms`),

      new ButtonBuilder()
        .setLabel('Privacy Policy')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.WEBSITE_URL}/privacy`)
    )

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true })
  }
}
