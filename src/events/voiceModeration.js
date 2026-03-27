const { AuditLogEvent } = require('discord.js');
const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',

  async execute(oldState, newState, client) {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guild = newState.guild || oldState.guild;
    const guildId = guild.id;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    // Wait for audit log to register
    await new Promise(r => setTimeout(r, 1000));

    const logs = await guild.fetchAuditLogs({
      limit: 5,
      type: AuditLogEvent.MemberMove
    }).catch(() => null);

    // ───────────────────────────────
    // 🚫 MEMBER DISCONNECTED
    // ───────────────────────────────
    if (oldChannel && !newChannel) {

      const disconnectLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.MemberDisconnect,
        limit: 5
      }).catch(() => null);

      const entry = disconnectLogs?.entries.find(e =>
        e.target?.id === member.id &&
        Date.now() - e.createdTimestamp < 5000
      );

      if (!entry) return; // user left himself

      await sendLog(client, guildId, 'voice_disconnected', {
        author: {
          name: member.user.username,
          iconURL: member.user.displayAvatarURL({ dynamic: true })
        },
        description:
          `🚫 **${member} was disconnected from voice channel**\n\n` +
          `🎧 Channel: ${oldChannel}\n` +
          `👮 Moderator: <@${entry.executor.id}>`,
        thumbnail: member.user.displayAvatarURL({ dynamic: true }),
        footer: `User ID: ${member.id}`
      });

      return;
    }

    // ───────────────────────────────
    // 🔄 MEMBER MOVED
    // ───────────────────────────────
    if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {

      const entry = logs?.entries.find(e =>
        e.target?.id === member.id &&
        Date.now() - e.createdTimestamp < 5000
      );

      if (!entry) return; // user switched himself

      await sendLog(client, guildId, 'voice_moved', {
        author: {
          name: member.user.username,
          iconURL: member.user.displayAvatarURL({ dynamic: true })
        },
        description:
          `🔄 **${member} was moved to another voice channel**\n\n` +
          `📤 From: ${oldChannel}\n` +
          `📥 To: ${newChannel}\n` +
          `👮 Moderator: <@${entry.executor.id}>`,
        thumbnail: member.user.displayAvatarURL({ dynamic: true }),
        footer: `User ID: ${member.id}`
      });

      return;
    }
  }
};
