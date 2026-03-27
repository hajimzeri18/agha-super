const mongoose = require('mongoose');

// Schema for each log event setting
const logEventSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  color: { type: String, default: '#5865f2' }
});

// Main guild settings schema
const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  guildName: { type: String },
  guildIcon: { type: String },

  // All 30 log events
  logs: {
    // Member Events
    member_joined:       { type: logEventSchema, default: () => ({}) },
    member_left:         { type: logEventSchema, default: () => ({}) },
    member_banned:       { type: logEventSchema, default: () => ({}) },
    member_unbanned:     { type: logEventSchema, default: () => ({}) },
    member_kicked:       { type: logEventSchema, default: () => ({}) },
    timeout_given:       { type: logEventSchema, default: () => ({}) },
    timeout_removed:     { type: logEventSchema, default: () => ({}) },
    nickname_changed:    { type: logEventSchema, default: () => ({}) },
    role_given:          { type: logEventSchema, default: () => ({}) },
    role_removed:        { type: logEventSchema, default: () => ({}) },
    mod_command:         { type: logEventSchema, default: () => ({}) },

    // Message Events
    message_deleted:     { type: logEventSchema, default: () => ({}) },
    message_edited:      { type: logEventSchema, default: () => ({}) },

    // Channel Events
    channel_created:     { type: logEventSchema, default: () => ({}) },
    channel_deleted:     { type: logEventSchema, default: () => ({}) },
    channel_updated:     { type: logEventSchema, default: () => ({}) },
    channel_perms:       { type: logEventSchema, default: () => ({}) },
    thread_created:      { type: logEventSchema, default: () => ({}) },
    thread_deleted:      { type: logEventSchema, default: () => ({}) },
    thread_updated:      { type: logEventSchema, default: () => ({}) },

    // Role Events
    role_created:        { type: logEventSchema, default: () => ({}) },
    role_deleted:        { type: logEventSchema, default: () => ({}) },
    role_updated:        { type: logEventSchema, default: () => ({}) },

    // Voice Events
    voice_join:          { type: logEventSchema, default: () => ({}) },
    voice_leave:         { type: logEventSchema, default: () => ({}) },
    voice_switch:        { type: logEventSchema, default: () => ({}) },
    voice_moved:         { type: logEventSchema, default: () => ({}) },
    voice_disconnected:  { type: logEventSchema, default: () => ({}) },
    voice_mute:          { type: logEventSchema, default: () => ({}) },

    // Server Events
    server_updated:      { type: logEventSchema, default: () => ({}) },
    invite_created:      { type: logEventSchema, default: () => ({}) },
  },

  // Moderation settings
  moderation: {
    modLogChannelId: { type: String, default: null },
    muteRoleId: { type: String, default: null },
    dmOnBan: { type: Boolean, default: true },
    dmOnKick: { type: Boolean, default: true },
    dmOnWarn: { type: Boolean, default: true },
  },

  // Auto mod settings
  automod: {
    antiSpam: {
      enabled: { type: Boolean, default: false },
      maxMessages: { type: Number, default: 5 },
      action: { type: String, default: 'timeout' }
    },
    badWords: {
      enabled: { type: Boolean, default: false },
      words: { type: [String], default: [] },
      action: { type: String, default: 'delete' }
    },
    antiLink: {
      enabled: { type: Boolean, default: false },
      blockInvites: { type: Boolean, default: true },
      blockExternal: { type: Boolean, default: false }
    },
    antiRaid: {
      enabled: { type: Boolean, default: false },
      joinThreshold: { type: Number, default: 10 },
      action: { type: String, default: 'lockdown' }
    }
  },

  // Welcome/Goodbye
  welcome: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: 'Welcome {user} to {server}! You are member #{count}.' }
  },
  goodbye: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: null },
    message: { type: String, default: '{user} has left the server.' }
  },

  // Auto roles
  autorole: {
    enabled: { type: Boolean, default: false },
    roleId: { type: String, default: null },
    delay: { type: Number, default: 0 },
    applyToBots: { type: Boolean, default: false }
  },

  // Bot settings
  settings: {
    prefix: { type: String, default: '!' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    adminRoles: { type: [String], default: [] }
  }

}, { timestamps: true });

module.exports = mongoose.model('Guild', guildSchema);
