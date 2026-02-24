# Logs Bot

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2.svg)](https://discord.js.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)

A comprehensive Discord audit logging bot that tracks **65+ event types** across 12 categories, paired with a full-featured web dashboard for managing and reviewing server logs.

## Why Logs Bot?

- **Complete audit trail** - Track everything from message edits and deletions to role changes, voice activity, and moderation actions.
- **Per-guild configuration** - Server admins choose exactly which events to log and where each log type is sent.
- **Web dashboard** - Manage multiple servers, browse logs, export reports, and view statistics through a modern React interface.
- **Real-time updates** - Live log streaming via Socket.io keeps your dashboard current.
- **Self-hostable** - Run your own instance with full control over your data.

## Log Categories

| Category | Events | Examples |
|----------|--------|----------|
| Channel Logs | 8 | Create, delete, update, pins |
| Member Logs | 4 | Join, leave, update, nickname |
| Message Logs | 4 | Edit, delete, bulk delete, pin |
| Moderation Logs | 9 | Ban, unban, timeout, permission changes |
| Role Logs | 3 | Create, delete, update |
| Voice Logs | 13 | Join, leave, mute, deafen, stream, move |
| Emoji & Sticker Logs | 6 | Create, delete, update |
| Invite Logs | 2 | Create, delete |
| Scheduled Event Logs | 7 | Create, delete, update, user actions |
| Nitro & Boost Logs | 3 | Boost, tier change |
| Webhook & Stage Logs | 4 | Create, delete, update |
| User Logs | 2 | Avatar, username changes |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Bot** | Node.js, discord.js v14, SQLite3 |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Express 5, TypeScript, SQLite3, Socket.io |

## Project Structure

```
Logs-Bot/
├── Logs Bot - Discord Bot/     # Discord bot (Node.js)
│   ├── Commands/                # 13 slash commands
│   ├── Logs/                    # 65 event handlers (12 categories)
│   ├── Systems/                 # Core systems (DB, join logs, DMs)
│   ├── index.js                 # Bot entry point
│   └── config.js                # Environment validation
│
├── Logs Bot - Website/          # Web dashboard
│   ├── src/                     # React frontend (TypeScript)
│   │   ├── pages/               # 11 pages + error pages
│   │   ├── components/          # 20 reusable components
│   │   ├── contexts/            # Auth & theme providers
│   │   └── services/            # API client
│   └── backend/                 # Express API server (TypeScript)
│       ├── server.ts            # Server setup & routing
│       ├── backend.ts           # Main API routes
│       ├── exportbackend.ts     # PDF export
│       └── statsbackend.ts      # Statistics API
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- A [Discord application](https://discord.com/developers/applications) with a bot token
- OAuth2 configured (for the web dashboard)

### 1. Clone the Repository

```bash
git clone https://github.com/ddex3/Logs-Bot.git
cd Logs-Bot
```

### 2. Set Up the Discord Bot

```bash
cd "Logs Bot - Discord Bot"
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_BOT_ID=your_bot_id
CONSOLE_LOG_WEBHOOK_URL=your_webhook_url
BOT_JOIN_LOG_CHANNEL_ID=your_channel_id
```

Start the bot:

```bash
node index.js
```

### 3. Set Up the Web Dashboard

```bash
cd "Logs Bot - Website"
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```env
DISCORD_BOT_TOKEN=your_bot_token
PORT=3001
VITE_DISCORD_CLIENT_ID=your_client_id
VITE_DISCORD_REDIRECT_URI=http://localhost:3000/discord
VITE_API_BASE_URL=http://localhost:3001/api
```

Run the frontend and backend together:

```bash
npm run logs
```

Or run them individually:

```bash
# Backend only
npm run dev:backend

# Frontend only (separate terminal)
npm run dev
```

The dashboard will be available at `http://localhost:5173` and the API at `http://localhost:3001`.

## Bot Commands

| Command | Description |
|---------|-------------|
| `/set-logs` | Assign a log type to a channel |
| `/settings` | View current log configuration |
| `/disable-logs` | Disable a specific log type |
| `/reset-settings` | Reset all log settings |
| `/logs-test` | Send a test log message |
| `/help` | Show bot info and commands |
| `/invite` | Get the bot invite link |
| `/support` | Join the support server |
| `/vote` | Vote on top.gg |
| `/legal` | View legal information |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

## Environment Variables

### Discord Bot

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | Yes | Discord bot token |
| `DISCORD_BOT_ID` | Yes | Bot application ID |
| `CONSOLE_LOG_WEBHOOK_URL` | Yes | Webhook URL for console logs |
| `BOT_JOIN_LOG_CHANNEL_ID` | Yes | Channel ID for bot join notifications |
| `DISCORD_API_VERSION` | No | Discord API version (default: 9) |
| `WEBSITE_URL` | No | Main website URL |
| `BOT_INVITE_URL` | No | Bot invite link |
| `SUPPORT_SERVER_URL` | No | Support server link |
| `TOPGG_VOTE_URL` | No | Top.gg vote link |

### Web Dashboard

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | Yes | Discord bot token |
| `PORT` | No | Backend port (default: 3001) |
| `CORS_ORIGIN` | No | Allowed CORS origin |
| `VITE_DISCORD_CLIENT_ID` | Yes | Discord OAuth2 client ID |
| `VITE_DISCORD_REDIRECT_URI` | Yes | OAuth2 redirect URI |
| `VITE_API_BASE_URL` | No | Backend API URL |
| `VITE_SUPPORT_SERVER_URL` | No | Support server link |
| `VITE_DISCORD_API_BASE_URL` | No | Discord API base URL |

## Support

- **Discord**: [Join the support server](https://logsbot.com/discord)
- **Issues**: [GitHub Issues](https://github.com/ddex3/Logs-Bot/issues)

## License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by **[@ddex3](https://github.com/ddex3)** & **[@coders908](https://github.com/coders908)**
