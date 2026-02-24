const { EmbedBuilder, AuditLogEvent, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

module.exports = (client) => {
const LOG_CHANNEL_ID = config.BOT_JOIN_LOG_CHANNEL_ID;

client.on('guildCreate', async (guild) => {
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;

    let inviter = 'Unknown';
    let inviterUser = null;
    try {
        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: 28 });
        const logEntry = fetchedLogs.entries.first();
        if (logEntry) {
            inviterUser = logEntry.executor;
            inviter = logEntry.executor.tag;
        }
    } catch (e) {}

    let inviteUrl = 'No Permission';
    try {
        const channel = guild.channels.cache
            .filter(c => c.type === 0 && c.permissionsFor(guild.members.me).has('CreateInstantInvite'))
            .first();
        if (channel) {
            const invite = await channel.createInvite({ maxAge: 0, maxUses: 0 });
            inviteUrl = invite.url;
        }
    } catch (e) {}

    const owner = await guild.fetchOwner().catch(() => null);
    const verificationLevel = guild.verificationLevel;
    const verificationLevels = {
        0: 'None',
        1: 'Low',
        2: 'Medium',
        3: 'High',
        4: 'Very High'
    };

    const embed = new EmbedBuilder()
        .setTitle('New Guild Joined')
        .setDescription(`The bot has been added to a new server!`)
        .setColor('#5865F2')
        .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
        .addFields(
            { 
                name: 'Server Information', 
                value: `**Name:** ${guild.name}\n**ID:** \`${guild.id}\`\n**Owner:** ${owner ? owner.user.tag : 'Unknown'}\n**Region:** ${guild.preferredLocale || 'Unknown'}`,
                inline: false 
            },
            { 
                name: 'Member Statistics', 
                value: `**Total Members:** ${guild.memberCount.toLocaleString()}\n**Verification Level:** ${verificationLevels[verificationLevel] || 'Unknown'}\n**Boost Level:** ${guild.premiumTier || 0}`,
                inline: true 
            },
            { 
                name: 'Channel Statistics', 
                value: `**Text Channels:** ${guild.channels.cache.filter(c => c.type === 0).size}\n**Voice Channels:** ${guild.channels.cache.filter(c => c.type === 2).size}\n**Categories:** ${guild.channels.cache.filter(c => c.type === 4).size}`,
                inline: true 
            },
            { 
                name: 'Added By', 
                value: inviterUser ? `${inviterUser} (${inviter})` : inviter,
                inline: true 
            },
            { 
                name: 'Joined At', 
                value: `<t:${Math.floor(Date.now() / 1000)}:F>\n<t:${Math.floor(Date.now() / 1000)}:R>`,
                inline: true 
            }
        )
        .setFooter({ 
            text: `Guild #${client.guilds.cache.size} | Bot: ${client.user.tag}`, 
            iconURL: client.user.displayAvatarURL() 
        })
        .setTimestamp();

    const components = [];
    if (inviteUrl !== 'No Permission') {
        const button = new ButtonBuilder()
            .setLabel('Join Server')
            .setURL(inviteUrl)
            .setStyle(ButtonStyle.Link);
        
        const row = new ActionRowBuilder()
            .addComponents(button);
        
        components.push(row);
    }

    logChannel.send({ 
        embeds: [embed],
        components: components.length > 0 ? components : undefined
    });
});
};