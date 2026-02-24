const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
const config = require('../config')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get the invite link to add the bot to your server'),

  async execute(interaction) {
    const bot = interaction.client.user

    const embed = new EmbedBuilder()
      .setTitle('Invite Me to Your Server!')
      .setDescription('Click the button below to invite the bot to your own server and level up your community.')
      .setColor('#007bff')
      .setThumbnail(bot.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `${bot.username} • Bot Invite`, iconURL: bot.displayAvatarURL() })
      .setTimestamp()

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Invite Bot')
        .setStyle(ButtonStyle.Link)
        .setURL(config.BOT_INVITE_URL)
    )

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true })
  }
}
