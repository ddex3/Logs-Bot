const { EmbedBuilder, AuditLogEvent, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

module.exports = (client) => {
  client.on('guildCreate', async (guild) => {
    try {
      const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.BotAdd,
      });
      const botAddLog = fetchedLogs.entries.find(entry => entry.target.id === client.user.id);
      let addUser;
      if (botAddLog) {
        addUser = botAddLog.executor;
      } else {
        addUser = (await guild.fetchOwner()).user;
      }

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Our Website')
            .setURL(config.WEBSITE_URL)
            .setStyle(ButtonStyle.Link),
          new ButtonBuilder()
            .setLabel('Support Server')
            .setURL(config.SUPPORT_SERVER_URL)
            .setStyle(ButtonStyle.Link)
        )

      const embed = new EmbedBuilder()
        .setDescription(`**Hey ${addUser},** 
        Thank you for adding **Logs Bot** to your server!  
        Logs Bot is your all-in-one solution for **advanced server logging** - designed to detect, monitor, and document every critical event on your server with precision.
        
        To get started, make sure to complete the initial setup.  
        You can view full instructions anytime using the \`/help\` command.`)
        .setColor('#bdffca')
        .setTimestamp()
        .setFooter({ text: guild.name, iconURL: guild.iconURL() });
      try {
        await addUser.send({ embeds: [embed], components: [row] });
      } catch (dmError) {
        console.log(`Could not send DM to ${addUser.tag}.`);
      }
    } catch (error) {
      console.error('Error in guildCreate event handler:', error);
    }
  });
};