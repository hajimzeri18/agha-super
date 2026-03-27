# 🤖 Agha Super Bot — Setup Guide
> Created by **dev-h46**

---

## 📁 Project Structure
```
agha-bot/
├── src/
│   ├── index.js              ← Main entry (bot + web server)
│   ├── models/
│   │   └── Guild.js          ← MongoDB schema (all log settings)
│   ├── utils/
│   │   └── logger.js         ← Sends log embeds to Discord channels
│   ├── events/
│   │   ├── ready.js
│   │   ├── guildMemberAdd.js
│   │   ├── guildMemberRemove.js
│   │   ├── guildMemberUpdate.js  ← Nickname, roles, timeout
│   │   ├── guildBanAdd.js
│   │   ├── guildBanRemove.js
│   │   ├── messages.js           ← Message deleted + edited
│   │   ├── voiceStateUpdate.js   ← All voice events
│   │   └── guildEvents.js        ← Channels, roles, threads, server
│   └── web/
│       ├── server.js             ← Express + Discord OAuth
│       └── public/
│           ├── index.html        ← Landing page
│           ├── servers.html      ← Server selector
│           └── dashboard.html    ← Full dashboard
├── .env                          ← Your credentials
└── package.json
```

---

## ⚡ Quick Setup

### Step 1 — Install Node.js
Download from: https://nodejs.org (version 18+)

### Step 2 — Install dependencies
Open terminal in the `agha-bot` folder and run:
```bash
npm install
```

### Step 3 — Discord Developer Portal
Go to: https://discord.com/developers/applications

1. Click your app → **OAuth2** → **Redirects**
2. Add: `http://localhost:3000/callback`
3. Save changes ✅

### Step 4 — Start the bot
```bash
npm start
```

You should see:
```
✅ MongoDB Connected
✅ Discord Bot Logged In
✅ Web Dashboard running on http://localhost:3000
🤖 Logged in as Agha Super Bot#XXXX
```

### Step 5 — Open Dashboard
Go to: http://localhost:3000

---

## 🔧 How Logs Work

1. Open dashboard → click **Event Logs** in sidebar
2. Find the event you want (e.g. **Member Banned**)
3. Toggle the switch **ON** ✅
4. Click the **#channel selector** → pick your Discord channel
5. (Optional) Click the **color dot** to pick embed color
6. Click **Save Changes** at the top right
7. Done! Now when that event happens in Discord, the bot sends an embed to your chosen channel ✅

---

## 🌐 Hosting Online (Production)

### Option A — Railway (Free)
1. Push code to GitHub
2. Go to https://railway.app
3. New Project → Deploy from GitHub
4. Add environment variables from `.env`
5. Change `CALLBACK_URL` to your Railway URL + `/callback`

### Option B — VPS (Ubuntu)
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (keeps bot running)
npm install -g pm2

# Start bot
pm2 start src/index.js --name agha-bot
pm2 startup
pm2 save
```

---

## 📋 All Log Events Supported

| Event | Discord Gateway |
|-------|----------------|
| Member Joined | guildMemberAdd |
| Member Left | guildMemberRemove |
| Member Banned | guildBanAdd |
| Member Unbanned | guildBanRemove |
| Member Kicked | guildBanAdd (audit) |
| Timeout Given/Removed | guildMemberUpdate |
| Nickname Changed | guildMemberUpdate |
| Role Given/Removed | guildMemberUpdate |
| Message Deleted | messageDelete |
| Message Edited | messageUpdate |
| Channel Created/Deleted/Updated | channelCreate/Delete/Update |
| Thread Created/Deleted/Updated | threadCreate/Delete |
| Role Created/Deleted/Updated | roleCreate/Delete/Update |
| Voice Join/Leave/Switch | voiceStateUpdate |
| Voice Mute/Deafen | voiceStateUpdate |
| Server Updated | guildUpdate |
| Invite Created | inviteCreate |

---

## ❓ Common Issues

**"Bot not in this server"** → Add bot to server first using the Invite button on servers page

**"MongoDB connection error"** → Check your MONGO_URI in .env

**"OAuth error"** → Make sure CALLBACK_URL in Discord Developer Portal matches your .env exactly

**Sessions not saving** → Make sure SESSION_SECRET is set in .env

---

Made with ❤️ by **dev-h46**
