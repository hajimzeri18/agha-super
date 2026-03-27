require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const mongoose = require('mongoose');
const startWebServer = require('./web/server');

// ─── Discord Client ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User]
});

// ─── Load Events ─────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const raw = require(path.join(eventsPath, file));
  const events = Array.isArray(raw) ? raw : [raw];
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
}

// ─── MongoDB + Start ──────────────────────────────────────────────────────────
async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    await client.login(process.env.BOT_TOKEN);
    console.log('✅ Discord Bot Logged In');

    startWebServer(client);
    console.log(`✅ Web Dashboard running on http://localhost:${process.env.PORT || 3000}`);
  } catch (err) {
    console.error('❌ Startup Error:', err);
    process.exit(1);
  }
}

main();

module.exports = client;
