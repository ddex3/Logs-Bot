import 'dotenv/config';

const REQUIRED_VARS = [
  'DISCORD_BOT_TOKEN',
] as const;

const OPTIONAL_VARS = {
  PORT: '3001',
  CORS_ORIGIN: 'https://logsbot.com',
  DISCORD_API_BASE_URL: 'https://discord.com/api/v10',
} as const;

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    return '';
  }
  return value.trim();
}

function validateEnv(): void {
  const missing = REQUIRED_VARS.filter(key => !getEnvVar(key));

  if (missing.length > 0) {
    console.error('\n[FATAL] Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\nCopy .env.example to .env and fill in all required values.\n');
    process.exit(1);
  }

  const token = getEnvVar('DISCORD_BOT_TOKEN');
  if (!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) {
    console.error('[FATAL] DISCORD_BOT_TOKEN format appears invalid.');
    process.exit(1);
  }

  const port = process.env.PORT || OPTIONAL_VARS.PORT;
  if (!/^\d+$/.test(port)) {
    console.error('[FATAL] PORT must be a valid number.');
    process.exit(1);
  }
}

validateEnv();

export const config = Object.freeze({
  DISCORD_BOT_TOKEN: getEnvVar('DISCORD_BOT_TOKEN'),
  DISCORD_API_BASE_URL: getEnvVar('DISCORD_API_BASE_URL') || OPTIONAL_VARS.DISCORD_API_BASE_URL,

  PORT: parseInt(process.env.PORT || OPTIONAL_VARS.PORT, 10),
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN') || OPTIONAL_VARS.CORS_ORIGIN,
});

export default config;
