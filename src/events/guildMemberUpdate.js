const { sendLog } = require('../utils/logger');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, client) {

    // ── Timeout Given ─────────────────────────────────────────────────────────
const { AuditLogEvent } = require('discord.js');
const sendLog = require('../utils/logger');

module.exports = {
  name: 'guildMemberUpdate',

  async execute(oldMember, newMember, client) {

    try {

      const oldTimeout = oldMember.communicationDisabledUntil;
      const newTimeout = newMember.communicationDisabledUntil;

      if (!oldTimeout && newTimeout && newTimeout > new Date()) {

        await new Promise(r => setTimeout(r, 1000));

        const audit = await newMember.guild.fetchAuditLogs({
          type: AuditLogEvent.MemberUpdate,
          limit: 5
        }).catch(() => null);

        const entry = audit?.entries.find(e =>
          e.target?.id === newMember.id &&
          (Date.now() - e.createdTimestamp) < 5000
        );

        const moderator = entry?.executor
          ? `<@${entry.executor.id}>`
          : 'Unknown';

        const reason = entry?.reason || 'No reason provided';

        const durationMs = newTimeout.getTime() - Date.now();
        const duration = formatDuration(durationMs);

        await sendLog(client, newMember.guild.id, 'timeout_given', {
          color: 0xF1C40F,
          description:
            `🔇 <@${newMember.id}> has been timed out\n` +
            `⏳ Duration: ${duration}\n` +
            `👮 Moderator: ${moderator}\n` +
            `📝 Reason: ${reason}`,
          footer: `User ID: ${newMember.id}`
        });

      }

    } catch (err) {
      console.error('Timeout log error:', err);
    }

  }
};

function formatDuration(ms) {

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years >= 1) return years + "y";
  if (months >= 1) return months + "mo";
  if (days >= 1) return days + "d";
  if (hours >= 1) return hours + "h";
  if (minutes >= 1) return minutes + "m";
  return seconds + "s";
}
    // ── Timeout Removed ───────────────────────────────────────────────────────
    if (oldTimeout && (!newTimeout || newTimeout <= new Date())) {
  await new Promise(r => setTimeout(r, 1200));

  const audit = await newMember.guild.fetchAuditLogs({
    type: AuditLogEvent.MemberUpdate,
    limit: 5
  }).catch(() => null);

  const entry = audit?.entries.find(e =>
    e.target?.id === newMember.id &&
    (Date.now() - e.createdTimestamp) < 5000
  );

  const moderator = entry?.executor ? `<@${entry.executor.id}>` : 'Unknown';
  const reason = entry?.reason || '**No reason provided**';

  await sendLog(client, newMember.guild.id, 'timeout_removed', {
    color: 0xF1C40F,
    author: {
      name: newMember.user.username,
      iconURL: newMember.user.displayAvatarURL({ dynamic: true })
    },
    description: `**${newMember}'s timeout has been ended / removed.**`,
    thumbnail: newMember.user.displayAvatarURL({ dynamic: true, size: 1024 }),
    fields: [
      { name: '**Responsible Moderator:**', value: moderator, inline: true },
      { name: '**Reason:**', value: reason, inline: true },
    ],
    footer: `User ID: ${newMember.user.id}`
  });
}

    // ── Nickname Changed ──────────────────────────────────────────────────────
if (oldMember.nickname !== newMember.nickname) {

  // small delay (audit logs sometimes slow)
  await new Promise(r => setTimeout(r, 800));

  const fetchedLogs = await newMember.guild.fetchAuditLogs({
    limit: 1,
    type: 24
  });

  const auditEntry = fetchedLogs.entries.first();
  const moderator = auditEntry?.executor;

  await sendLog(client, newMember.guild.id, 'nickname_changed', {
  author: {
    name: newMember.user.username,
    iconURL: newMember.user.displayAvatarURL({ dynamic: true })
  },
  title: '**Nickname Changed**',
  description: `${newMember}'s nickname has been changed.`,
  thumbnail: newMember.user.displayAvatarURL({ dynamic: true, size: 1024 }),
  fields: [
    { name: '**Old Nickname:**', value: oldMember.nickname || '*None*', inline: true },
    { name: '**New Nickname:**', value: newMember.nickname || '*None*', inline: true },
    { name: '**Responsible Moderator:**', value: moderator ? `<@${moderator.id}>` : 'Unknown', inline: false },
  ],
  footer: `User ID: ${newMember.user.id}`
});


}


    // ── Role Given ────────────────────────────────────────────────────────────
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    if (addedRoles.size > 0) {
  await new Promise(r => setTimeout(r, 500));

  const audit = await newMember.guild.fetchAuditLogs({
    type: AuditLogEvent.MemberRoleUpdate,
    limit: 1
  }).catch(() => null);

  const entry = audit?.entries.first();
  const moderator = entry?.executor ? `<@${entry.executor.id}>` : 'Unknown';

  await sendLog(client, newMember.guild.id, 'role_given', {
    color: 0xF1C40F,
    author: {
      name: newMember.user.username,
      iconURL: newMember.user.displayAvatarURL({ dynamic: true })
    },
    description: `**${newMember} has been updated.**`,
    thumbnail: newMember.user.displayAvatarURL({ dynamic: true, size: 1024 }),
    fields: [
      { name: '**Roles:**', value: addedRoles.map(r => `✅ <@&${r.id}>`).join('\n'), inline: false },
      { name: '**Responsible Moderator:**', value: moderator, inline: false },
    ],
    footer: `User ID: ${newMember.user.id}`
  });
}

    // ── Role Removed ──────────────────────────────────────────────────────────
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
    if (removedRoles.size > 0) {
  await new Promise(r => setTimeout(r, 500));

  const audit = await newMember.guild.fetchAuditLogs({
    type: AuditLogEvent.MemberRoleUpdate,
    limit: 1
  }).catch(() => null);

  const entry = audit?.entries.first();
  const moderator = entry?.executor ? `<@${entry.executor.id}>` : 'Unknown';

  await sendLog(client, newMember.guild.id, 'role_removed', {
    color: 0xF1C40F,
    author: {
      name: newMember.user.username,
      iconURL: newMember.user.displayAvatarURL({ dynamic: true })
    },
    description: `**${newMember} has been updated.**`,
    thumbnail: newMember.user.displayAvatarURL({ dynamic: true, size: 1024 }),
    fields: [
      { name: '**Roles:**', value: removedRoles.map(r => `❌ <@&${r.id}>`).join('\n'), inline: false },
      { name: '**Responsible Moderator:**', value: moderator, inline: false },
    ],
    footer: `User ID: ${newMember.user.id}`
  });
}
  }
};
