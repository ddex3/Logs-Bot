const { Client, GatewayIntentBits, Partials, ActivityType, Collection, EmbedBuilder, WebhookClient } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config');
const chalk = require('chalk');

const client = new Client({ intents: Object.values(GatewayIntentBits).reduce((a, p) => a | p, 0),   partials: [Partials.Channel, Partials.Message]});

client.setMaxListeners(50);

client.once('ready', async () => {
  const ts = () => `[${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}]`;


  const statuses = [
    () => `/help | logsbot.com`,
    () => `Currently on ${client.guilds.cache.size} servers`
  ];
  let i = 0;
  setInterval(() => client.user?.setPresence({
    activities: [{ name: statuses[i++ % statuses.length](), type: ActivityType.Custom }],
    status: 'dnd'
  }), 20000);

  client.commands = new Collection();

  function loadSlashCommandsRecursively(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        loadSlashCommandsRecursively(fullPath);
      } else if (file.endsWith('.js')) {
        try {
          const cmd = require(fullPath);
          if (cmd.data && cmd.execute) {
            client.commands.set(cmd.data.name, cmd);
            console.log(chalk.blue(`${ts()} Loaded command: ${cmd.data.name}`));
          }
        } catch (error) {
          console.error(chalk.red(`${ts()} Failed to load slash command from ${file}: ${error}`));
        }
      }
    }
  }

function loadLogHandlers(dir) {
  if (!fs.existsSync(dir)) return;
  const categories = fs.readdirSync(dir);

  const categoryColors = {
    'Channel Logs': chalk.gray,
    'Emoji & Sticker Logs': chalk.yellowBright,
    'Invite Logs': chalk.cyan,
    'Member Logs': chalk.blue,
    'Message Logs': chalk.white,
    'Moderation Logs': chalk.redBright,
    'Nitro & Boost Logs': chalk.hex('#ff5c5c'),
    'Role Logs': chalk.magentaBright,
    'Scheduled Event Logs': chalk.whiteBright,
    'User Logs': chalk.hex('#1f9eff'),
    'Voice Logs': chalk.hex('#2de38d'),
    'Webhook & Stage Logs': chalk.hex('#7e5eff')
  };

  for (const category of categories) {
    const categoryPath = path.join(dir, category);
    const stat = fs.statSync(categoryPath);
    if (!stat.isDirectory()) continue;

    const color = categoryColors[category] || chalk.white;
    const files = fs.readdirSync(categoryPath);

    for (const file of files) {
      const fullPath = path.join(categoryPath, file);
      if (!file.endsWith('.js')) continue;
      try {
        require(fullPath)(client);
        console.log(color(`${ts()} Loaded log handler: ${category}/${file}`));
      } catch (error) {
        console.error(chalk.red(`${ts()} Failed to load log handler from ${category}/${file}: ${error}`));
      }
    }
  }
}


  function loadSystems(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        loadSystems(fullPath);
      } else if (file.endsWith('.js')) {
        try {
          require(fullPath)(client);
          console.log(chalk.cyan(`${ts()} Loaded system: ${file}`));
        } catch (error) {
          console.error(chalk.red(`${ts()} Failed to load system from ${file}: ${error}`));
        }
      }
    }
  }


  loadSlashCommandsRecursively(path.join(__dirname, 'Commands'));
  loadLogHandlers(path.join(__dirname, 'Logs'));
  loadSystems(path.join(__dirname, 'Systems'));


  try {
    const rest = new REST({ version: config.DISCORD_API_VERSION }).setToken(config.DISCORD_BOT_TOKEN);
    await rest.put(Routes.applicationCommands(config.DISCORD_BOT_ID), {
      body: client.commands.map(cmd => cmd.data.toJSON())
    });
    console.log(chalk.green(`${ts()} All Slash Commands Registered.`));
  } catch (error) {
    console.error(chalk.red(`${ts()} ${error}`));
  }

  console.log(chalk.hex('#90ee90')(`${ts()} Logged in as ${client.user.tag}!`));

});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const ts = () => `[${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}]`;
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(chalk.yellow(`${ts()} No command matching ${interaction.commandName} was found.`));
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(chalk.red(`${ts()} Error executing ${interaction.commandName}: ${error}`));
    try {
      await interaction.reply({ content: 'There was an error!', ephemeral: true });
    } catch (replyError) {
      console.error(chalk.red(`${ts()} Failed to reply: ${replyError}`));
    }
  }
});

['unhandledRejection', 'uncaughtException', 'error', 'warn'].forEach(e =>
  process.on(e, error => console.error(chalk.red(`[${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}] ${e}:`, error)))
);

const webhook = new WebhookClient({ url: config.CONSOLE_LOG_WEBHOOK_URL });

function sendToWebhook(level, content) {
  const embed = new EmbedBuilder()
    .setTitle(`Console ${level}`)
    .setDescription(`\`\`\`js\n${content.slice(0, 4000)}\n\`\`\``)
    .setColor('#FFFFFF')
    .setTimestamp();
  webhook.send({ embeds: [embed] }).catch(() => {});
}

['log', 'error', 'warn', 'info'].forEach(type => {
  const original = console[type];
  console[type] = (...args) => {
    const text = args.map(a => (typeof a === 'string' ? a : require('util').inspect(a))).join(' ');
    sendToWebhook(type.toUpperCase(), text);
    original.apply(console, args);
  };
});

client.login(config.DISCORD_BOT_TOKEN);
