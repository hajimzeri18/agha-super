require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const Guild = require('../models/Guild');

// ─── Passport Discord OAuth ───────────────────────────────────────────────────
passport.use(new DiscordStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Not authenticated' });
}

// ─── Admin Check Middleware ───────────────────────────────────────────────────
function isAdmin(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  // 0x8 = ADMINISTRATOR permission flag
  const hasAdmin = req.user.guilds?.some(g =>
    g.id === req.params.guildId && (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8)
  );
  if (!hasAdmin) return res.status(403).json({ error: 'You are not an admin of this server' });
  next();
}

// ─── Start Server ─────────────────────────────────────────────────────────────
function startWebServer(client) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session
  app.use(session({
    secret: process.env.SESSION_SECRET || 'agha-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Serve static HTML files
  app.use(express.static(path.join(__dirname, 'public')));

  // ─── OAuth Routes ───────────────────────────────────────────────────────────
  app.get('/auth/discord', passport.authenticate('discord'));

  app.get('/callback', passport.authenticate('discord', {
    failureRedirect: '/'
  }), (req, res) => {
    res.redirect('/servers');
  });

  app.get('/auth/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
  });

  // ─── Page Routes ────────────────────────────────────────────────────────────
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/servers', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'servers.html'));
  });

  app.get('/dashboard/:guildId', isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
  });

  // ─── API: Get current user ──────────────────────────────────────────────────
  app.get('/api/me', isLoggedIn, (req, res) => {
    res.json({
      id: req.user.id,
      username: req.user.username,
      discriminator: req.user.discriminator,
      avatar: req.user.avatar
        ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`
    });
  });

  // ─── API: Get user's admin guilds ───────────────────────────────────────────
  app.get('/api/guilds', isLoggedIn, async (req, res) => {
    try {
      // Filter to guilds where user is ADMINISTRATOR (bit 0x8)
      const adminGuilds = req.user.guilds?.filter(g =>
        (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8)
      ) || [];

      // Check which guilds have the bot
      const botGuilds = client.guilds.cache;

      const guildsWithStatus = adminGuilds.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon
          ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
          : null,
        hasBot: botGuilds.has(g.id),
        memberCount: botGuilds.get(g.id)?.memberCount || null,
      }));

      res.json(guildsWithStatus);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── API: Get guild channels ─────────────────────────────────────────────────
  app.get('/api/guilds/:guildId/channels', isLoggedIn, isAdmin, async (req, res) => {
    try {
      const guild = client.guilds.cache.get(req.params.guildId);
      if (!guild) return res.status(404).json({ error: 'Bot not in this server' });

      const { ChannelType } = require('discord.js');
      // Only real text channels (no voice, stage, forum, thread, category)
      const channels = guild.channels.cache
        .filter(ch =>
          ch.type === ChannelType.GuildText ||
          ch.type === ChannelType.GuildAnnouncement
        )
        .map(ch => ({
          id: ch.id,
          name: ch.name,
          parentName: ch.parent?.name || null,
          position: ch.rawPosition
        }))
        .sort((a, b) => (a.parentName || '\x00').localeCompare(b.parentName || '\x00') || a.position - b.position);

      res.json(channels);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── API: Get guild roles ────────────────────────────────────────────────────
  app.get('/api/guilds/:guildId/roles', isLoggedIn, isAdmin, async (req, res) => {
    try {
      const guild = client.guilds.cache.get(req.params.guildId);
      if (!guild) return res.status(404).json({ error: 'Bot not in this server' });

      const roles = guild.roles.cache
        .filter(r => r.id !== guild.id)
        .map(r => ({ id: r.id, name: r.name, color: r.hexColor }))
        .sort((a, b) => a.name.localeCompare(b.name));

      res.json(roles);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── API: Get guild settings ─────────────────────────────────────────────────
  app.get('/api/guilds/:guildId/settings', isLoggedIn, isAdmin, async (req, res) => {
    try {
      let settings = await Guild.findOne({ guildId: req.params.guildId });
      if (!settings) {
        const guild = client.guilds.cache.get(req.params.guildId);
        settings = await Guild.create({
          guildId: req.params.guildId,
          guildName: guild?.name || 'Unknown',
          guildIcon: guild?.iconURL() || null
        });
      }
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── API: Save guild settings ─────────────────────────────────────────────────
  app.post('/api/guilds/:guildId/settings', isLoggedIn, isAdmin, async (req, res) => {
    try {
      const { guildId } = req.params;
      const body = req.body;

      let settings = await Guild.findOne({ guildId });
      if (!settings) {
        const guild = client.guilds.cache.get(guildId);
        settings = await Guild.create({ guildId, guildName: guild?.name || 'Unknown' });
      }

      // Deep merge the body into settings
      if (body.logs) {
        for (const [key, val] of Object.entries(body.logs)) {
          if (settings.logs[key] !== undefined) {
            settings.logs[key] = { ...settings.logs[key]?.toObject?.() || {}, ...val };
          }
        }
      }

      if (body.moderation) Object.assign(settings.moderation, body.moderation);
      if (body.automod) {
        for (const [key, val] of Object.entries(body.automod)) {
          Object.assign(settings.automod[key], val);
        }
      }
      if (body.welcome) Object.assign(settings.welcome, body.welcome);
      if (body.goodbye) Object.assign(settings.goodbye, body.goodbye);
      if (body.autorole) Object.assign(settings.autorole, body.autorole);
      if (body.settings) Object.assign(settings.settings, body.settings);

      settings.markModified('logs');
      settings.markModified('automod');
      await settings.save();

      res.json({ success: true, message: 'Settings saved!' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── API: Save single log event ───────────────────────────────────────────────
  app.post('/api/guilds/:guildId/logs/:eventKey', isLoggedIn, isAdmin, async (req, res) => {
    try {
      const { guildId, eventKey } = req.params;
      const { enabled, channelId, color } = req.body;

      let settings = await Guild.findOne({ guildId });
      if (!settings) {
        const guild = client.guilds.cache.get(guildId);
        settings = await Guild.create({ guildId, guildName: guild?.name || 'Unknown' });
      }

      if (!settings.logs[eventKey] && settings.logs[eventKey] !== null) {
        return res.status(400).json({ error: `Unknown log event: ${eventKey}` });
      }

      settings.logs[eventKey] = {
        enabled: enabled !== undefined ? enabled : settings.logs[eventKey]?.enabled,
        channelId: channelId !== undefined ? channelId : settings.logs[eventKey]?.channelId,
        color: color !== undefined ? color : settings.logs[eventKey]?.color || '#5865f2'
      };

      settings.markModified('logs');
      await settings.save();

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── API: Real server stats ───────────────────────────────────────────────────
  app.get('/api/guilds/:guildId/stats', isLoggedIn, isAdmin, async (req, res) => {
    try {
      const guild = client.guilds.cache.get(req.params.guildId);
      if (!guild) return res.status(404).json({ error: 'Bot not in this server' });

      await guild.members.fetch();

      const members    = guild.memberCount;
      const bots       = guild.members.cache.filter(m => m.user.bot).size;
      const humans     = members - bots;
      const online     = guild.members.cache.filter(m => m.presence?.status !== 'offline' && !m.user.bot).size;
      const channels   = guild.channels.cache.size;
      const roles      = guild.roles.cache.size - 1;
      const boostLevel = guild.premiumTier;
      const boosts     = guild.premiumSubscriptionCount || 0;
      const createdAt  = Math.floor(guild.createdTimestamp / 1000);
      const icon       = guild.iconURL({ dynamic: true, size: 128 });
      const banner     = guild.bannerURL({ size: 512 });

      res.json({ members, humans, bots, online, channels, roles, boostLevel, boosts, createdAt, icon, banner, name: guild.name });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── API: Real audit log ──────────────────────────────────────────────────────
  app.get('/api/guilds/:guildId/audit', isLoggedIn, isAdmin, async (req, res) => {
    try {
      const guild = client.guilds.cache.get(req.params.guildId);
      if (!guild) return res.status(404).json({ error: 'Bot not in this server' });

      const logs = await guild.fetchAuditLogs({ limit: 25 });
      const entries = logs.entries.map(e => ({
        id: e.id,
        action: e.actionType,
        actionId: e.action,
        executor: e.executor ? { id: e.executor.id, tag: e.executor.tag, avatar: e.executor.displayAvatarURL?.() } : null,
        target: e.target ? { id: e.target.id, tag: e.target.tag || e.target.name || e.target.id } : null,
        reason: e.reason || null,
        createdAt: e.createdTimestamp,
        changes: e.changes?.map(c => ({ key: c.key, old: c.old, new: c.new })) || []
      }));

      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ─── Start Listening ──────────────────────────────────────────────────────────
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  });
}

module.exports = startWebServer;
