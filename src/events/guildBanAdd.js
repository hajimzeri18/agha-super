const { sendLog } = require('../utils/logger');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    await new Promise(r => setTimeout(r, 1000));
    const auditLogs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => null);
    const entry = auditLogs?.entries.first();
    const moderator = entry?.executor ? `<@${entry.executor.id}>` : 'Unknown';
    const reason = entry?.reason || '**no reason provided**';

    await sendLog(client, ban.guild.id, 'member_banned', {
  author: {
    name: ban.user.username,
    iconURL: ban.user.displayAvatarURL({ dynamic: true })
  },
  description: `**✈️ ${ban.user} Banned from the server.**`,
  thumbnail: ban.user.displayAvatarURL({ dynamic: true, size: 1024 }),
  fields: [
    { name: '**Responsible Moderator:**', value: moderator, inline: true },
    { name: '**Reason:**', value: reason, inline: true },
  ],
  footer: `User ID: ${ban.user.id}`
});
  }
};
