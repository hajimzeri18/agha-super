const { sendLog } = require('../utils/logger');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    await new Promise(r => setTimeout(r, 1000));

    // Check audit log for KICK
    const auditLogs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 }).catch(() => null);
    const entry = auditLogs?.entries.first();
    const isKick = entry && entry.target?.id === member.user.id && (Date.now() - entry.createdTimestamp) < 5000;

    if (isKick) {
      // ── Member Kicked ──────────────────────────────────────────────────────
      await sendLog(client, member.guild.id, 'member_kicked', {
  author: {
    name: member.user.username,
    iconURL: member.user.displayAvatarURL({ dynamic: true })
  },
  description: `👋 ${member.user} **kicked.**`,
  thumbnail: member.user.displayAvatarURL({ dynamic: true, size: 1024 }),
  fields: [
    { name: '**Responsible Moderator:**', value: `<@${entry.executor.id}>`, inline: true },
    { name: '**Reason:**', value: entry.reason || '**No reason provided**', inline: true },
  ],
  footer: `User ID: ${member.user.id}`
});
    } else {
      // ── Member Left ────────────────────────────────────────────────────────
      await sendLog(client, member.guild.id, 'member_left', {
  author: {
    name: member.user.username,
    iconURL: member.user.displayAvatarURL({ dynamic: true })
  },
  description: `${member.user} **Left the server.**`,
  thumbnail: member.user.displayAvatarURL({ dynamic: true, size: 1024 }),
  footer: `User ID: ${member.user.id}`
});
    }
  }
};
