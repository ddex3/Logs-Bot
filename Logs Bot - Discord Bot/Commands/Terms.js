const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('terms')
    .setDescription('View the bot\'s terms of use'),

  async execute(interaction) {
    const bot = interaction.client.user

    const embed = new EmbedBuilder()
      .setTitle('Terms of Use')
      .setDescription('Please review our terms of use before using the bot.')
      .setColor('#007bff')
      .setThumbnail(bot.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${bot.username} • Terms of Use`, iconURL: bot.displayAvatarURL() })
      .setTimestamp()

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('View Terms of Use')
        .setStyle(ButtonStyle.Link)
        .setURL('https://logsbot.com/terms')
    )

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true })
  }
}
