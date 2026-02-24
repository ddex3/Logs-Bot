const { EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { saveServerLog } = require('../../Systems/savelogs');

module.exports = (client, config) => {
  const dataDir = path.join(process.cwd(), 'Data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, 'logsChannels.db');
  const db = new sqlite3.Database(dbPath);

  client.on('guildUpdate', async (oldGuild, newGuild) => {
    if (oldGuild.premiumTier === newGuild.premiumTier) return;
    const timestamp = Math.floor(Date.now() / 1000);
    db.get("SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Boost Tier Changed'", [newGuild.id], async (_, row) => {
      if (!row || !newGuild.channels.cache.get(row.channel_id)) return;
      const embed = new EmbedBuilder()
        .setTitle('Server Boost Tier Changed')
        .addFields({ name: 'Previous Tier', value: `Tier ${oldGuild.premiumTier}`, inline: true }, { name: 'New Tier', value: `Tier ${newGuild.premiumTier}`, inline: true }, { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false })
        .setColor('#67e68d')
        .setThumbnail(newGuild.iconURL())
        .setFooter({ text: `${client.user.username} • Boost Tier Changed`, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();
      newGuild.channels.cache.get(row.channel_id).send({ embeds: [embed] }).then(sent => {
        const fields = [
          { name: 'Previous Tier', value: `Tier ${oldGuild.premiumTier}`, inline: true },
          { name: 'New Tier', value: `Tier ${newGuild.premiumTier}`, inline: true },
          { name: 'Time', value: `<t:${timestamp}> (<t:${timestamp}:R>)`, inline: false }
        ];
        saveServerLog(newGuild.id, 'boost', 'Boost Tier Changed', 0x67e68d, fields, row.channel_id, sent.id, newGuild.iconURL(), `${client.user.username} • Boost Tier Changed`);
      }).catch(() => {});
    });
  });
};