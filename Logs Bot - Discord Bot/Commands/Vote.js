const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const config = require('../config')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('Vote for the bot and help us grow!'),

  async execute(interaction) {
    const bot = interaction.client.user

    const embed = new EmbedBuilder()
      .setTitle('Vote for the Bot!')
      .setDescription('Support the bot by voting on our bot list page. Every vote helps us improve and reach more servers 💙')
      .setColor('#007bff')
      .setThumbnail(bot.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${bot.username} • Voting Support`, iconURL: bot.displayAvatarURL() })
      .setTimestamp()

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Vote on Top.gg')
        .setStyle(ButtonStyle.Link)
        .setURL(config.TOPGG_VOTE_URL)
    )

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true })
  }
}
