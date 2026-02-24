const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType,
  ChannelType,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'Data', 'logsChannels.db');
if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new sqlite3.Database(dbPath);
db.run('CREATE TABLE IF NOT EXISTS logs_channels (guild_id TEXT, log TEXT, channel_id TEXT, PRIMARY KEY (guild_id, log))');

const categories = [
  { name: 'Member Logs', logs: ['Member Joined', 'Member Left', 'Member Updated', 'Nickname Changed'] },
  { name: 'User Logs', logs: ['Username Changed', 'Avatar Changed'] },
  { name: 'Moderation & Security Logs', logs: ['Member Banned', 'Ban Removed', 'Timeout Applied', 'Timeout Removed', 'Member Kicked', 'Presence Updated', 'Permission Overwrites Changed', 'Bot Added to Server', 'Bot Removed from Server'] },
  { name: 'Role Logs', logs: ['Role Created', 'Role Deleted', 'Role Updated'] },
  { name: 'Channel Logs', logs: ['Channel Created', 'Channel Deleted', 'Channel Updated', 'Thread Created', 'Thread Updated', 'Thread Deleted', 'AFK Channel Changed', 'System Messages Channel Changed'] },
  { name: 'Message Logs', logs: ['Message Sent', 'Message Edited', 'Message Deleted', 'Bulk Message Deleted'] },
  { name: 'Invite Logs', logs: ['Invite Created', 'Invite Deleted'] },
  { name: 'Voice Logs', logs: ['Voice State Updated', 'Started Streaming', 'Stopped Streaming', 'Started Video', 'Stopped Video', 'Self Muted', 'Self Unmuted', 'Self Deafened', 'Self Undeafened', 'Server Muted', 'Server Unmuted', 'Server Deafened', 'Server Undeafened'] },
  { name: 'Webhook & Stage Logs', logs: ['Webhook Updated', 'Stage Started', 'Stage Updated', 'Stage Ended'] },
  { name: 'Scheduled Event Logs', logs: ['Scheduled Event Created', 'Scheduled Event Updated', 'Scheduled Event Deleted', 'Scheduled Event Started', 'Scheduled Event Ended', 'Event Subscription Added', 'Event Subscription Removed'] },
  { name: 'Emoji & Sticker Logs', logs: ['Emoji Created', 'Emoji Updated', 'Emoji Deleted', 'Sticker Created', 'Sticker Updated', 'Sticker Deleted'] },
  { name: 'Nitro & Boost Logs', logs: ['Server Boosted', 'Server Boost Removed', 'Boost Tier Changed'] }
];

function logToChannelName(logType) {
  return logType
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/&/g, 'and')
    + '-logs';
}

function formatChannelName(logType, separator, emoji) {
  const baseName = logToChannelName(logType);
  
  if (!emoji || emoji === 'none') {
    return baseName;
  }
  
  let formattedName;
  
  const normalizedSeparator = separator || 'none';
  
  if (normalizedSeparator === 'none') {
    formattedName = `${emoji}-${baseName}`;
  } else {
    switch (normalizedSeparator) {
      case 'parentheses':
        formattedName = `（${emoji}）${baseName}`;
        break;
      case 'pipe':
        formattedName = `${emoji}┊${baseName}`;
        break;
      case 'bullet':
        formattedName = `${emoji}・${baseName}`;
        break;
      default:
        formattedName = `${emoji}-${baseName}`;
    }
  }
  
  if (formattedName.length > 100) {
    const maxBaseLength = 100 - (formattedName.length - baseName.length);
    const truncatedBase = baseName.substring(0, maxBaseLength);
    return formattedName.replace(baseName, truncatedBase);
  }
  
  return formattedName;
}

function createProgressBar(current, total) {
  const percent = Math.floor((current / total) * 100);
  const filled = Math.floor(percent / 5);
  const empty = 20 - filled;
  return `\`\`\`\n${'▓'.repeat(filled)}${'░'.repeat(empty)} ${percent}% (${current} / ${total})\n\`\`\``;
}

function wantEmojiButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('want_emoji_yes')
      .setLabel('Yes')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('want_emoji_no')
      .setLabel('No')
      .setStyle(ButtonStyle.Danger)
  );
}

function separatorSelectMenu(emoji = '📁') {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('separator_select')
      .setPlaceholder('Choose a separator style')
      .setOptions([
        { label: 'Parentheses （ ）', value: 'parentheses', description: `Example: （${emoji}） message-sent-logs` },
        { label: 'Pipe ┊', value: 'pipe', description: `Example: ${emoji}┊message-sent-logs` },
        { label: 'Bullet ・', value: 'bullet', description: `Example: ${emoji}・message-sent-logs` },
        { label: 'None', value: 'none', description: `Example: ${emoji}-message-sent-logs` }
      ])
  );
}

function emojiSelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('emoji_select')
      .setPlaceholder('Choose an emoji')
      .setOptions([
        { label: '📁 Folder', value: '📁', description: 'Use folder emoji' },
        { label: '🔧 Wrench', value: '🔧', description: 'Use wrench emoji' },
        { label: 'Custom Emoji', value: 'custom', description: 'Enter your own emoji' }
      ])
  );
}

function categorySelectMenu(selectedCategories = []) {
  const options = categories.map((cat, index) => ({
    label: cat.name,
    value: String(index),
    description: `${cat.logs.length} log types`,
    default: selectedCategories.includes(String(index))
  }));
  
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('category_select')
      .setPlaceholder('Select categories to create')
      .setMinValues(1)
      .setMaxValues(categories.length)
      .setOptions(options)
  );
}

function summaryEmbed(separator, emoji, selectedCategories, client, totalSteps) {
  const selectedCats = selectedCategories.map(idx => categories[parseInt(idx)]);
  const totalChannels = selectedCats.reduce((sum, cat) => sum + cat.logs.length, 0);
  
  const separatorText = separator === 'none' ? 'None' : 
    separator === 'parentheses' ? 'Parentheses （ ）' :
    separator === 'pipe' ? 'Pipe ┊' :
    separator === 'bullet' ? 'Bullet ・' : separator;
  
  const emojiText = emoji === 'none' ? 'None' : emoji === 'custom' ? 'Custom (will be asked)' : emoji;
  
  const exampleName = formatChannelName('Message Sent', separator, emoji === 'custom' ? '📁' : emoji);
  
  let description = '';
  if (emoji !== 'none') {
    description += `**Emoji:** ${emojiText}\n`;
    description += `**Separator:** ${separatorText}\n`;
  } else {
    description += `**Emoji:** None\n`;
  }
  description += `**Example Channel Name:** \`${exampleName}\`\n\n`;
  description += `**Selected Categories:** ${selectedCats.length}\n`;
  description += `**Total Channels to Create:** ${totalChannels}\n\n`;
  description += `**Categories:**\n${selectedCats.map(cat => `• ${cat.name} (${cat.logs.length} channels)`).join('\n')}`;
  
  return new EmbedBuilder()
    .setAuthor({ name: `Setup Summary (${totalSteps}/${totalSteps})` })
    .setDescription(description)
    .setColor('#007bff')
    .setThumbnail(client.user.displayAvatarURL())
    .setFooter({ text: `${client.user.username} • Logs Setup`, iconURL: client.user.displayAvatarURL() })
    .setTimestamp();
}

function confirmButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('confirm_setup')
      .setLabel('Confirm & Create')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('change_categories')
      .setLabel('Change Categories')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('change_appearance')
      .setLabel('Change Appearance')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('cancel_setup')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger)
  );
}

function createEmojiModal(stepNum, totalSteps) {
  const modal = new ModalBuilder()
    .setCustomId('custom_emoji_modal')
    .setTitle(`Custom Emoji (${stepNum}/${totalSteps})`);
  
  const emojiInput = new TextInputBuilder()
    .setCustomId('emoji_input')
    .setLabel('Enter your emoji')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('📁 🔧 ⚙️ 🎯')
    .setRequired(true)
    .setMaxLength(10);
  
  const actionRow = new ActionRowBuilder().addComponents(emojiInput);
  modal.addComponents(actionRow);
  
  return modal;
}

async function createChannels(interaction, separator, emoji, selectedCategories) {
  const guild = interaction.guild;
  const selectedCats = selectedCategories.map(idx => categories[parseInt(idx)]);
  
  const maxChannels = guild.maximumChannels || 500;
  const currentChannels = guild.channels.cache.size;
  const channelsToCreate = selectedCats.reduce((sum, cat) => sum + cat.logs.length + 1, 0);
  
  if (currentChannels + channelsToCreate > maxChannels) {
    const warningEmbed = new EmbedBuilder()
      .setAuthor({ name: '⚠️ Channel Limit Warning' })
      .setDescription(`This server has a limit of ${maxChannels} channels.\n\n` +
        `Current channels: ${currentChannels}\n` +
        `Channels to create: ${channelsToCreate}\n` +
        `Total would be: ${currentChannels + channelsToCreate}\n\n` +
        `**This exceeds the limit by ${currentChannels + channelsToCreate - maxChannels} channels.**\n\n` +
        `Please reduce the number of categories or delete some existing channels.`)
      .setColor('#ff6b6b')
      .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();
    
    return { success: false, embed: warningEmbed };
  }
  
  let totalChannels = 0;
  let createdChannels = 0;
  const allLogs = [];
  
  selectedCats.forEach(cat => {
    totalChannels += cat.logs.length;
    cat.logs.forEach(log => allLogs.push({ category: cat.name, log }));
  });
  
  const progressEmbed = new EmbedBuilder()
    .setAuthor({ name: 'Creating Channels...' })
    .setDescription(`${createProgressBar(0, totalChannels)}\n\n` +
      `**Created:** 0/${totalChannels}\n` +
      `**Current: Starting...**`)
    .setColor('#007bff')
    .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
    .setTimestamp();
  
  await interaction.editReply({ embeds: [progressEmbed], components: [] });
  
  const createdChannelsList = [];
  const errors = [];
  
  try {
    const botMember = await guild.members.fetch(interaction.client.user.id);
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      const errorEmbed = new EmbedBuilder()
        .setAuthor({ name: '❌ Missing Permissions' })
        .setDescription('The bot needs the "Manage Channels" permission to create channels.')
        .setColor('#ff6b6b')
        .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();
      
      return { success: false, embed: errorEmbed };
    }
    
    const everyoneRole = guild.roles.everyone;
    
    const adminRoles = guild.roles.cache.filter(role => role.permissions.has(PermissionsBitField.Flags.Administrator));
    
    for (const cat of selectedCats) {
      let categoryChannel;
      try {
        const categoryName = cat.name
          .split(/\s+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        const categoryOverwrites = [
          {
            id: everyoneRole.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: botMember.id,
            allow: [PermissionsBitField.Flags.ViewChannel]
          }
        ];
        
        adminRoles.forEach(role => {
          categoryOverwrites.push({
            id: role.id,
            allow: [PermissionsBitField.Flags.ViewChannel]
          });
        });
        
        categoryChannel = await guild.channels.create({
          name: categoryName,
          type: ChannelType.GuildCategory,
          permissionOverwrites: categoryOverwrites
        });
      } catch (error) {
        errors.push(`Failed to create category "${cat.name}": ${error.message}`);
        continue;
      }
      
      for (const log of cat.logs) {
        try {
          const channelName = formatChannelName(log, separator, emoji);
          
          const channelOverwrites = [
            {
              id: everyoneRole.id,
              deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
              id: botMember.id,
              allow: [PermissionsBitField.Flags.ViewChannel]
            }
          ];
          
          adminRoles.forEach(role => {
            channelOverwrites.push({
              id: role.id,
              allow: [PermissionsBitField.Flags.ViewChannel]
            });
          });
          
          const channel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: categoryChannel.id,
            permissionOverwrites: channelOverwrites
          });
          
          db.run('INSERT OR REPLACE INTO logs_channels (guild_id, log, channel_id) VALUES (?, ?, ?)',
            [guild.id, log, channel.id]);
          
          createdChannels++;
          createdChannelsList.push({ log, channel: channel.id });
          
          const progress = createProgressBar(createdChannels, totalChannels);
          const progressDesc = `${progress}\n\n` +
            `**Created:** ${createdChannels}/${totalChannels}\n` +
            `**Current:** ${log}`;
          
          progressEmbed.setDescription(progressDesc);
          try {
            await interaction.editReply({ embeds: [progressEmbed] });
          } catch (updateError) {
            console.error('Failed to update progress:', updateError.message);
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          errors.push(`Failed to create channel for "${log}": ${error.message}`);
        }
      }
    }
    
    const finalProgress = createProgressBar(createdChannels, totalChannels);
    let finalDescription = `${finalProgress}\n\n`;
    finalDescription += `**Created:** ${createdChannels}/${totalChannels} channels\n`;
    finalDescription += `**Categories:** ${selectedCats.length}\n\n`;
    
    if (errors.length > 0) {
      finalDescription += `**Errors:** ${errors.length}\n`;
      finalDescription += errors.slice(0, 5).map(e => `• ${e}`).join('\n');
      if (errors.length > 5) {
        finalDescription += `\n... and ${errors.length - 5} more errors`;
      }
    }
    
    progressEmbed
      .setAuthor({ name: 'Setup Complete!' })
      .setDescription(finalDescription)
      .setColor(errors.length > 0 ? '#ffa500' : '#67e68d')
      .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();
    
    return { success: true, embed: progressEmbed };
  } catch (error) {
    const errorEmbed = new EmbedBuilder()
      .setAuthor({ name: 'Setup Failed' })
      .setDescription(`An error occurred during setup:\n\`\`\`${error.message}\`\`\``)
      .setColor('#ff6b6b')
      .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();
    
    return { success: false, embed: errorEmbed };
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Automatically set up log channels with custom formatting'),
  
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setDescription('❌ Administrator permission required.')
          .setColor('#f25252')],
        ephemeral: true
      });
    }
    
    let separator = null;
    let emoji = null;
    let selectedCategories = [];
    let wantsEmoji = null;
    let step = 'want_emoji';
    let totalSteps = 4;
    
    const wantEmojiEmbed = new EmbedBuilder()
      .setAuthor({ name: 'Setup - Step 1: Emoji Selection (1/4)' })
      .setDescription('Do you want to add an emoji to your channel names?\n\n' +
        '**Examples with emoji:**\n' +
        '• `📁-message-sent-logs`\n' +
        '• `（📁） message-sent-logs`\n' +
        '• `📁┊message-sent-logs`\n\n' +
        '**Example without emoji:**\n' +
        '• `message-sent-logs`')
      .setColor('#007bff')
      .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();
    
    await interaction.reply({
      embeds: [wantEmojiEmbed],
      components: [wantEmojiButtons()],
      ephemeral: true
    });
    
    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ time: 600000 });
    
    const modalHandler = async (modalInteraction) => {
      if (!modalInteraction.isModalSubmit()) return;
      if (modalInteraction.customId !== 'custom_emoji_modal') return;
      if (modalInteraction.user.id !== interaction.user.id) {
        return modalInteraction.reply({ content: 'This is not your setup!', ephemeral: true });
      }
      
      try {
        let customEmoji = modalInteraction.fields.getTextInputValue('emoji_input').trim();
        
        const emojiMatch = customEmoji.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
        if (emojiMatch) {
          emoji = emojiMatch[0];
        } else {
          emoji = '📁';
        }
        
        step = 'separator';
        
        const separatorEmbed = new EmbedBuilder()
          .setAuthor({ name: `Setup - Step 3: Choose Separator (3/${totalSteps})` })
          .setDescription(`Select how you want to format the emoji in channel names.\n\n` +
            `**Options:**\n` +
            `• **Parentheses （ ）** - \`（${emoji}） message-sent-logs\`\n` +
            `• **Pipe ┊** - \`${emoji}┊message-sent-logs\`\n` +
            `• **Bullet ・** - \`${emoji}・message-sent-logs\`\n` +
            `• **None** - \`${emoji}-message-sent-logs\``)
          .setColor('#007bff')
          .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
          .setTimestamp();
        
        const successEmbed = new EmbedBuilder()
          .setDescription('Emoji selected!')
          .setColor('#67e68d');
        
        await modalInteraction.reply({ embeds: [successEmbed], ephemeral: true });
        await interaction.editReply({ embeds: [separatorEmbed], components: [separatorSelectMenu(emoji)] });
      } catch (error) {
        console.error('Modal error:', error);
        await modalInteraction.reply({ content: 'An error occurred. Please try again.', ephemeral: true });
      }
    };
      
    interaction.client.on('interactionCreate', modalHandler);
    
    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'This is not your setup!', ephemeral: true });
      }
      
      try {
        if (step === 'want_emoji' && i.isButton()) {
          if (i.customId === 'want_emoji_yes') {
            wantsEmoji = true;
            totalSteps = 5;
            step = 'emoji';
            
            const emojiEmbed = new EmbedBuilder()
              .setAuthor({ name: `Setup - Step 2: Choose Emoji (2/${totalSteps})` })
              .setDescription('Select an emoji to use in channel names.\n\n' +
                '**Options:**\n' +
                '• **📁 Folder** - Standard folder emoji\n' +
                '• **🔧 Wrench** - Standard wrench emoji\n' +
                '• **Custom** - Choose your own emoji')
              .setColor('#007bff')
              .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
              .setTimestamp();
            
            await i.update({ embeds: [emojiEmbed], components: [emojiSelectMenu()] });
          } else if (i.customId === 'want_emoji_no') {
            wantsEmoji = false;
            emoji = 'none';
            separator = 'none';
            totalSteps = 3;
            
            if (selectedCategories.length > 0) {
              step = 'summary';
              const summary = summaryEmbed(separator, emoji, selectedCategories, interaction.client, totalSteps);
              summary.setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

              await i.update({ embeds: [summary], components: [confirmButtons()] });
            } else {
              step = 'categories';
              const categoryEmbed = new EmbedBuilder()
                .setAuthor({ name: `Setup - Step 2: Select Categories (2/${totalSteps})` })
                .setDescription('Select which log categories you want to create channels for.\n\n' +
                  'You can select multiple categories. Each category will create a separate category channel with all its log channels inside.')
                .setColor('#007bff')
                .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
              
              await i.update({ embeds: [categoryEmbed], components: [categorySelectMenu()] });
            }
          }
        }
        
        else if (step === 'emoji' && i.isStringSelectMenu() && i.customId === 'emoji_select') {
          if (i.values[0] === 'custom') {
            const modal = createEmojiModal(2, totalSteps);
            await i.showModal(modal);
          } else {
            emoji = i.values[0];
            step = 'separator';
            
            const separatorEmbed = new EmbedBuilder()
              .setAuthor({ name: `Setup - Step 3: Choose Separator (3/${totalSteps})` })
              .setDescription(`Select how you want to format the emoji in channel names.\n\n` +
                `**Options:**\n` +
                `• **Parentheses （ ）** - \`（${emoji}） message-sent-logs\`\n` +
                `• **Pipe ┊** - \`${emoji}┊message-sent-logs\`\n` +
                `• **Bullet ・** - \`${emoji}・message-sent-logs\`\n` +
                `• **None** - \`${emoji}-message-sent-logs\``)
              .setColor('#007bff')
              .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
              .setTimestamp();
            
            await i.update({ embeds: [separatorEmbed], components: [separatorSelectMenu(emoji)] });
          }
        }
        
        else if (step === 'separator' && i.isStringSelectMenu() && i.customId === 'separator_select') {
          separator = i.values[0];
          
          if (selectedCategories.length > 0) {
            step = 'summary';
            const summary = summaryEmbed(separator, emoji, selectedCategories, interaction.client, totalSteps);
            summary.setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
              .setTimestamp();

            await i.update({ embeds: [summary], components: [confirmButtons()] });
          } else {
            step = 'categories';
            const categoryEmbed = new EmbedBuilder()
              .setAuthor({ name: `Setup - Step 4: Select Categories (4/${totalSteps})` })
              .setDescription('Select which log categories you want to create channels for.\n\n' +
                'You can select multiple categories. Each category will create a separate category channel with all its log channels inside.')
              .setColor('#007bff')
              .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
              .setTimestamp();
            
            await i.update({ embeds: [categoryEmbed], components: [categorySelectMenu()] });
          }
        }
        
        else if (step === 'categories' && i.isStringSelectMenu() && i.customId === 'category_select') {
          selectedCategories = i.values;
          step = 'summary';
          
          const summary = summaryEmbed(separator, emoji, selectedCategories, interaction.client, totalSteps);
          summary.setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();
          
          await i.update({ embeds: [summary], components: [confirmButtons()] });
        }
        
        else if (step === 'summary' && i.isButton()) {
          if (i.customId === 'confirm_setup') {
            await i.deferUpdate();
            if (wantsEmoji === false) {
              emoji = 'none';
              separator = 'none';
            }
            const result = await createChannels(interaction, separator, emoji, selectedCategories);
            await interaction.editReply({ embeds: [result.embed], components: [] });
            collector.stop();
          }
          else if (i.customId === 'change_categories') {
            step = 'categories';
            const stepNum = wantsEmoji ? 4 : 2;
            const categoryEmbed = new EmbedBuilder()
              .setAuthor({ name: `Setup - Step ${stepNum}: Select Categories (${stepNum}/${totalSteps})` })
              .setDescription('Select which log categories you want to create channels for.\n\n' +
                'You can select multiple categories. Each category will create a separate category channel with all its log channels inside.')
              .setColor('#007bff')
              .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
              .setTimestamp();
            
            await i.update({ embeds: [categoryEmbed], components: [categorySelectMenu(selectedCategories)] });
          }
          else if (i.customId === 'change_appearance') {
            if (selectedCategories.length > 0) {
              if (wantsEmoji) {
                step = 'emoji';
                const emojiEmbed = new EmbedBuilder()
                  .setAuthor({ name: `Setup - Step 2: Choose Emoji (2/${totalSteps})` })
                  .setDescription('Select an emoji to use in channel names.\n\n' +
                    '**Options:**\n' +
                    '• **📁 Folder** - Standard folder emoji\n' +
                    '• **🔧 Wrench** - Standard wrench emoji\n' +
                    '• **Custom** - Choose your own emoji')
                  .setColor('#007bff')
                  .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
                  .setTimestamp();
                
                await i.update({ embeds: [emojiEmbed], components: [emojiSelectMenu()] });
              } else {
                step = 'want_emoji';
                const wantEmojiEmbed = new EmbedBuilder()
                  .setAuthor({ name: `Setup - Step 1: Emoji Selection (1/${totalSteps})` })
                  .setDescription('Do you want to add an emoji to your channel names?\n\n' +
                    '**Examples with emoji:**\n' +
                    '• `📁-message-sent-logs`\n' +
                    '• `（📁） message-sent-logs`\n' +
                    '• `📁┊message-sent-logs`\n\n' +
                    '**Example without emoji:**\n' +
                    '• `message-sent-logs`')
                  .setColor('#007bff')
                  .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
                  .setTimestamp();
                
                await i.update({ embeds: [wantEmojiEmbed], components: [wantEmojiButtons()] });
              }
            } else {
              step = 'want_emoji';
              const wantEmojiEmbed = new EmbedBuilder()
                .setAuthor({ name: `Setup - Step 1: Emoji Selection (1/${totalSteps})` })
                .setDescription('Do you want to add an emoji to your channel names?\n\n' +
                  '**Examples with emoji:**\n' +
                  '• `📁-message-sent-logs`\n' +
                  '• `（📁） message-sent-logs`\n' +
                  '• `📁┊message-sent-logs`\n\n' +
                  '**Example without emoji:**\n' +
                  '• `message-sent-logs`')
                .setColor('#007bff')
                .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
              
              await i.update({ embeds: [wantEmojiEmbed], components: [wantEmojiButtons()] });
            }
          }
          else if (i.customId === 'cancel_setup') {
            const cancelEmbed = new EmbedBuilder()
              .setAuthor({ name: 'Setup Cancelled' })
              .setDescription('The setup process has been cancelled.')
              .setColor('#ff6b6b')
              .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
              .setTimestamp();
            
            await i.update({ embeds: [cancelEmbed], components: [] });
            collector.stop();
          }
        }
      } catch (error) {
        console.error('Setup error:', error);
        const errorEmbed = new EmbedBuilder()
          .setAuthor({ name: 'Error' })
          .setDescription(`An error occurred: ${error.message}`)
          .setColor('#ff6b6b')
          .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
          .setTimestamp();
        
        try {
          if (i.deferred || i.replied) {
            await interaction.editReply({ embeds: [errorEmbed], components: [] });
          } else {
            await i.reply({ embeds: [errorEmbed], ephemeral: true });
          }
        } catch (e) {
          console.error('Failed to send error message:', e);
        }
      }
    });
    
    collector.on('end', async (collected, reason) => {
      interaction.client.removeListener('interactionCreate', modalHandler);
      
      if (reason === 'time') {
        const timeoutEmbed = new EmbedBuilder()
          .setAuthor({ name: 'Setup Timeout' })
          .setDescription('The setup process timed out. Please run `/setup` again to start over.')
          .setColor('#ff6b6b')
          .setFooter({ text: `${interaction.client.user.username} • Logs Setup`, iconURL: interaction.client.user.displayAvatarURL() })
          .setTimestamp();
        
        try {
          await interaction.editReply({ embeds: [timeoutEmbed], components: [] });
        } catch (e) {
        }
      }
    });
  }
};

