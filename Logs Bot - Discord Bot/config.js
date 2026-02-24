require('dotenv').config();

const REQUIRED_VARS = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_BOT_ID',
  'CONSOLE_LOG_WEBHOOK_URL',
  'BOT_JOIN_LOG_CHANNEL_ID',
];

const OPTIONAL_VARS = {
  DISCORD_API_VERSION: '9',
  WEBSITE_URL: 'https://logsbot.com',
  BOT_INVITE_URL: '',
  SUPPORT_SERVER_URL: 'https://logsbot.com/discord',
  TOPGG_VOTE_URL: '',
};

function validateEnv() {
  const missing = REQUIRED_VARS.filter(key => !process.env[key] || process.env[key].trim() === '');

  if (missing.length > 0) {
    console.error('\n[FATAL] Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\nCopy .env.example to .env and fill in all required values.\n');
    process.exit(1);
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) {
    console.error('[FATAL] DISCORD_BOT_TOKEN format appears invalid.');
    process.exit(1);
  }

  const botId = process.env.DISCORD_BOT_ID;
  if (!/^\d{17,19}$/.test(botId)) {
    console.error('[FATAL] DISCORD_BOT_ID must be a valid Discord snowflake (17-19 digits).');
    process.exit(1);
  }

  const webhookUrl = process.env.CONSOLE_LOG_WEBHOOK_URL;
  if (!/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/.test(webhookUrl)) {
    console.error('[FATAL] CONSOLE_LOG_WEBHOOK_URL format is invalid.');
    process.exit(1);
  }

  const channelId = process.env.BOT_JOIN_LOG_CHANNEL_ID;
  if (!/^\d{17,19}$/.test(channelId)) {
    console.error('[FATAL] BOT_JOIN_LOG_CHANNEL_ID must be a valid Discord snowflake.');
    process.exit(1);
  }
}

validateEnv();

const config = Object.freeze({
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  DISCORD_BOT_ID: process.env.DISCORD_BOT_ID,
  DISCORD_API_VERSION: process.env.DISCORD_API_VERSION || OPTIONAL_VARS.DISCORD_API_VERSION,

  CONSOLE_LOG_WEBHOOK_URL: process.env.CONSOLE_LOG_WEBHOOK_URL,

  BOT_JOIN_LOG_CHANNEL_ID: process.env.BOT_JOIN_LOG_CHANNEL_ID,

  WEBSITE_URL: process.env.WEBSITE_URL || OPTIONAL_VARS.WEBSITE_URL,
  BOT_INVITE_URL: process.env.BOT_INVITE_URL || `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_BOT_ID}`,
  SUPPORT_SERVER_URL: process.env.SUPPORT_SERVER_URL || OPTIONAL_VARS.SUPPORT_SERVER_URL,
  TOPGG_VOTE_URL: process.env.TOPGG_VOTE_URL || `https://top.gg/bot/${process.env.DISCORD_BOT_ID}`,
});

module.exports = config;
