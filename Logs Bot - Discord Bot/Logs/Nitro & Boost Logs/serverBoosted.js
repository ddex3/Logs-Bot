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

  client.on('guildMemberUpdate', async (o, n) => {
    if (n.premiumSince && !o.premiumSince) {
      const t = Math.floor(Date.now() / 1000);
      const g = n.guild;
      db.get("SELECT channel_id FROM logs_channels WHERE guild_id = ? AND log = 'Server Boosted'", [g.id], (_, r) => {
        if (!r?.channel_id || !g.channels.cache.get(r.channel_id)) return;
        const e = new EmbedBuilder().setTitle('New Boost!').setDescription(`${n.user} boosted!`)
          .addFields({ name: 'User', value: `${n.user.tag} (<@${n.id}>)`, inline: true },
            { name: 'Boosts', value: `${g.premiumSubscriptionCount}`, inline: true },
            { name: 'Level', value: `Tier ${g.premiumTier}`, inline: true },
            { name: 'Time', value: `<t:${t}> (<t:${t}:R>)`, inline: false })
          .setThumbnail(n.user.displayAvatarURL()).setColor('#67e68d')
          .setFooter({ text: `${client.user.username} • Nitro Boost`, iconURL: client.user.displayAvatarURL() })
          .setTimestamp();
        g.channels.cache.get(r.channel_id).send({ embeds: [e] }).then(sent => {
          const fields = [
            { name: 'User', value: `${n.user.tag} (<@${n.id}>)`, inline: true },
            { name: 'Boosts', value: `${g.premiumSubscriptionCount}`, inline: true },
            { name: 'Level', value: `Tier ${g.premiumTier}`, inline: true },
            { name: 'Time', value: `<t:${t}> (<t:${t}:R>)`, inline: false }
          ];
          saveServerLog(g.id, 'boost', 'Nitro Boost', 0x67e68d, fields, r.channel_id, sent.id, n.user.displayAvatarURL(), `${client.user.username} • Nitro Boost`);
        }).catch(() => {});
      });
    }
  });
};