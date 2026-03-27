const { sendLog } = require('../utils/logger');
const { PermissionsBitField, AuditLogEvent } = require('discord.js');

// ── Channel Created ────────────────────────────────────────────────────────────
const channelCreate = {
  name: 'channelCreate',
  async execute(channel, client) {
    if (!channel.guild) return;

    let executor = 'Unknown';
    try {
      const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: 10 });
      const entry = logs.entries.first();
      if (entry && entry.target.id === channel.id) {
        executor = `<@${entry.executor.id}>`;
      }
    } catch (err) {}

    await sendLog(client, channel.guild.id, 'channel_created', {
  author: {
  name: channel.guild.name,
  iconURL: channel.guild.iconURL({ dynamic: true }) 
           || client.user.displayAvatarURL({ dynamic: true })
},

thumbnail: channel.guild.iconURL({ dynamic: true }) 
           || client.user.displayAvatarURL({ dynamic: true }),

description:
    ` **𝗖𝗵𝗮𝗻𝗻𝗲𝗹 𝗖𝗿𝗲𝗮𝘁𝗲𝗱: \`${channel.name}\`**\n\n` +
    ` 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗶𝗯𝗹𝗲 𝗠𝗼𝗱𝗲𝗿𝗮𝘁𝗼𝗿\n${executor}`
});
  }
};

// ── Channel Deleted ───────────────────────────────────────────────────────────
const channelDelete = {
  name: 'channelDelete',
  async execute(channel, client) {
    if (!channel.guild) return;

    let executor = 'Unknown';
    try {
      const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: 12 });
      const entry = logs.entries.first();
      if (entry && entry.target.id === channel.id) {
        executor = `<@${entry.executor.id}>`;
      }
    } catch (err) {}

    await sendLog(client, channel.guild.id, 'channel_deleted', {
  author: {
  name: channel.guild.name,
  iconURL: channel.guild.iconURL({ dynamic: true }) 
           || client.user.displayAvatarURL({ dynamic: true })
},

thumbnail: channel.guild.iconURL({ dynamic: true }) 
           || client.user.displayAvatarURL({ dynamic: true }),

  description:
        ` **𝗖𝗵𝗮𝗻𝗻𝗲𝗹 𝗗𝗲𝗹𝗲𝘁𝗲𝗱: \`${channel.name}\`**\n\n` +
        ` 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗶𝗯𝗹𝗲 𝗠𝗼𝗱𝗲𝗿𝗮𝘁𝗼𝗿\n${executor}`
    });
  }
};

// ── Channel Updated + Permissions Updated ─────────────────────────────────────

const channelUpdate = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel, client) {
    if (!newChannel.guild) return;

    const guild = newChannel.guild;

    const guildIcon =
      guild.iconURL({ dynamic: true }) ||
      client.user.displayAvatarURL({ dynamic: true });

    // ─────────────────────────────────────────
    // 🔹 CHANNEL NAME UPDATED
    // ─────────────────────────────────────────

    let nameExecutor = 'Unknown';

    try {
      const logs = await guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelUpdate,
        limit: 5
      });

      const entry = logs.entries.find(e =>
        e.target?.id === newChannel.id &&
        Date.now() - e.createdTimestamp < 5000
      );

      if (entry) {
        nameExecutor = `<@${entry.executor.id}>`;
      }
    } catch (err) {}

    if (oldChannel.name !== newChannel.name) {

      await sendLog(client, guild.id, 'channel_updated', {
        author: {
          name: guild.name,
          iconURL: guildIcon
        },

        description: ` **Channel Updated: \`${newChannel.name}\`**`,

        fields: [
          { name: 'Old Name', value: `\`${oldChannel.name}\``, inline: true },
          { name: 'New Name', value: `\`${newChannel.name}\``, inline: true },
          { name: 'Responsible Moderator', value: nameExecutor, inline: true }
        ],

        footer: `Channel ID: ${newChannel.id}`
      });
    }

    // ─────────────────────────────────────────
    // 🔹 CHANNEL PERMISSIONS UPDATED
    // ─────────────────────────────────────────

    await new Promise(resolve => setTimeout(resolve, 1200));

    let permExecutor = 'Unknown';

    try {

      const types = [
        AuditLogEvent.ChannelOverwriteUpdate,
        AuditLogEvent.ChannelOverwriteCreate,
        AuditLogEvent.ChannelOverwriteDelete
      ];

      for (const type of types) {

        const logs = await guild.fetchAuditLogs({
          limit: 5,
          type
        });

        const entry = logs.entries.find(e =>
          e.target?.id === newChannel.id &&
          Date.now() - e.createdTimestamp < 5000
        );

        if (entry) {
          permExecutor = `<@${entry.executor.id}>`;
          break;
        }
      }

    } catch (err) {}

    const oldOverwrites = oldChannel.permissionOverwrites.cache;
    const newOverwrites = newChannel.permissionOverwrites.cache;

    const groupedChanges = [];

    for (const [id, newPerm] of newOverwrites) {

      const oldPerm = oldOverwrites.get(id);

      const target =
        id === guild.id
          ? '@everyone'
          : newPerm.type === 0
            ? `<@&${id}>`
            : `<@${id}>`;

      const permLines = [];

      for (const perm of Object.keys(PermissionsBitField.Flags)) {

        const oldAllow = oldPerm ? oldPerm.allow.has(perm) : false;
        const oldDeny  = oldPerm ? oldPerm.deny.has(perm)  : false;

        const newAllow = newPerm.allow.has(perm);
        const newDeny  = newPerm.deny.has(perm);

        if (oldAllow !== newAllow || oldDeny !== newDeny) {

          if (newAllow)
            permLines.push(`:white_check_mark: ${formatPermission(perm)}`);

          else if (newDeny)
            permLines.push(`:no_entry: ${formatPermission(perm)}`);

          else
            permLines.push(`➖ ${formatPermission(perm)}`);
        }
      }

      if (permLines.length > 0) {
        groupedChanges.push(`**${target}**\n${permLines.join('\n')}`);
      }
    }

    if (groupedChanges.length > 0) {

      await sendLog(client, guild.id, 'channel_perms', {
        author: {
          name: guild.name,
          iconURL: guildIcon
        },

        description: ` **Channel Permissions Updated: \`${newChannel.name}\`**`,

        fields: [
          {
            name: 'Permission Changes',
            value: groupedChanges.join('\n\n').slice(0, 1000),
            inline: false
          },
          {
            name: 'Responsible Moderator',
            value: permExecutor,
            inline: false
          }
        ],

        footer: `Channel ID: ${newChannel.id}`
      });
    }
  }
};

module.exports = channelUpdate;

// ── Thread Created ─────────────────────────────────────────────────────────────
const threadCreate = {
  name: 'threadCreate',
  async execute(thread, client) {
    if (!thread.guild) return;
    await sendLog(client, thread.guild.id, 'thread_created', {
      title: '🧵 Thread Created',
      description: `A new thread **${thread.name}** was created.`,
      fields: [
        { name: '🧵 Thread', value: `<#${thread.id}>`, inline: true },
        { name: '📢 Parent', value: thread.parent ? `<#${thread.parentId}>` : 'Unknown', inline: true },
      ],
      footer: `Thread ID: ${thread.id}`
    });
  }
};

// ── Thread Deleted ─────────────────────────────────────────────────────────────
const threadDelete = {
  name: 'threadDelete',
  async execute(thread, client) {
    if (!thread.guild) return;
    await sendLog(client, thread.guild.id, 'thread_deleted', {
      title: '🧵 Thread Deleted',
      description: `Thread **${thread.name}** was deleted.`,
      fields: [
        { name: '🆔 Thread ID', value: thread.id, inline: true },
        { name: '📢 Parent', value: thread.parent ? `<#${thread.parentId}>` : 'Unknown', inline: true },
      ],
      footer: `Thread ID: ${thread.id}`
    });
  }
};

// ── Role Created ───────────────────────────────────────────────────────────────
const roleCreate = {
  name: 'roleCreate',
  async execute(role, client) {

    await new Promise(r => setTimeout(r, 1000));

    const logs = await role.guild.fetchAuditLogs({ limit: 1 }).catch(() => null);
    const entry = logs?.entries.first();
    const executor = entry?.executor;

    const guildIcon =
      role.guild.iconURL({ dynamic: true }) ||
      client.user.displayAvatarURL({ dynamic: true });

    await sendLog(client, role.guild.id, 'role_created', {
      author: {
        name: role.guild.name,
        iconURL: guildIcon
      },

      thumbnail: guildIcon,

      description: ` **𝗥𝗼𝗹𝗲 𝗖𝗿𝗲𝗮𝘁𝗲𝗱: ${role.name}**`,

      fields: [
        {
          name: ' 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗶𝗯𝗹𝗲 𝗠𝗼𝗱𝗲𝗿𝗮𝘁𝗼𝗿',
          value: executor ? `<@${executor.id}>` : 'Unknown',
          inline: false
        }
      ]
    });
  }
};

// ── Role Deleted ───────────────────────────────────────────────────────────────
const roleDelete = {
  name: 'roleDelete',
  async execute(role, client) {

    await new Promise(r => setTimeout(r, 1000));

    const logs = await role.guild.fetchAuditLogs({ limit: 1 }).catch(() => null);
    const entry = logs?.entries.first();
    const executor = entry?.executor;

    const guildIcon =
      role.guild.iconURL({ dynamic: true }) ||
      client.user.displayAvatarURL({ dynamic: true });

    await sendLog(client, role.guild.id, 'role_deleted', {
      author: {
        name: role.guild.name,
        iconURL: guildIcon
      },

      thumbnail: guildIcon,

      description: ` **𝗥𝗼𝗹𝗲 𝗗𝗲𝗹𝗲𝘁𝗲𝗱: ${role.name}**`,

      fields: [
        {
          name: ' 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗶𝗯𝗹𝗲 𝗠𝗼𝗱𝗲𝗿𝗮𝘁𝗼𝗿',
          value: executor ? `<@${executor.id}>` : 'Unknown',
          inline: false
        }
      ]
    });
  }
};

// ── Role Updated ───────────────────────────────────────────────
const roleUpdate = {
  name: 'roleUpdate',
  async execute(oldRole, newRole, client) {

    await new Promise(r => setTimeout(r, 800));

    const logs = await newRole.guild.fetchAuditLogs({
      type: AuditLogEvent.RoleUpdate,
      limit: 1
    }).catch(() => null);

    const entry = logs?.entries.first();
    const executor = entry?.executor;

    const guildIcon =
      newRole.guild.iconURL({ dynamic: true }) ||
      client.user.displayAvatarURL({ dynamic: true });

    const fields = [];

    // ── Name Change ─────────────────────────
    if (oldRole.name !== newRole.name) {
      fields.push(
        {
          name: '𝗢𝗹𝗱 𝗡𝗮𝗺𝗲',
          value: ` | ${oldRole.name}`,
          inline: true
        },
        {
          name: '𝗡𝗲𝘄 𝗡𝗮𝗺𝗲',
          value: ` | ${newRole.name}`,
          inline: true
        }
      );
    }

    // ── Permission Changes ─────────────────
    const oldPerms = oldRole.permissions;
    const newPerms = newRole.permissions;

    const added = [];
    const removed = [];

    for (const perm of Object.keys(PermissionsBitField.Flags)) {

      const hadBefore = oldPerms.has(perm);
      const hasNow    = newPerms.has(perm);

      if (!hadBefore && hasNow) {
        added.push(`✅ ${formatPermission(perm)}`);
      }

      if (hadBefore && !hasNow) {
        removed.push(`⛔ ${formatPermission(perm)}`);
      }
    }

    if (added.length) {
      fields.push({
        name: '𝗡𝗲𝘄 𝗣𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻𝘀',
        value: added.join('\n'),
        inline: false
      });
    }

    if (removed.length) {
      fields.push({
        name: '𝗥𝗲𝗺𝗼𝘃𝗲𝗱 𝗣𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻𝘀',
        value: removed.join('\n'),
        inline: false
      });
    }

    if (!fields.length) return;

    fields.push({
      name: ' 𝗥𝗲𝘀𝗽𝗼𝗻𝘀𝗶𝗯𝗹𝗲 𝗠𝗼𝗱𝗲𝗿𝗮𝘁𝗼𝗿',
      value: executor ? `<@${executor.id}>` : 'Unknown',
      inline: false
    });

    await sendLog(client, newRole.guild.id, 'role_updated', {
      author: {
        name: newRole.guild.name,
        iconURL: guildIcon
      },

      thumbnail: guildIcon,

      description: ` **𝗥𝗼𝗹𝗲 𝗨𝗽𝗱𝗮𝘁𝗲𝗱: ${newRole.name}**`,
      fields
    });
  }
};

// ── Permission Formatter (Clean Names) ───
function formatPermission(permission) {
  return permission
    .replace(/([A-Z])/g, ' $1')
    .replace(/Guild/g, 'Server')
    .trim();
};

// ── Guild Updated ─────────────────────────────
const guildUpdate = {

  name: 'guildUpdate',
  async execute(oldGuild, newGuild, client) {
    const changes = [];
    if (oldGuild.name !== newGuild.name) changes.push(`Name: **${oldGuild.name}** → **${newGuild.name}**`);
    if (oldGuild.icon !== newGuild.icon) changes.push('Server icon changed');
    if (oldGuild.description !== newGuild.description) changes.push('Description changed');
    if (!changes.length) return;

    await sendLog(client, newGuild.id, 'server_updated', {
      title: '🏠 Server Updated',
      description: `Server **${newGuild.name}** was updated.`,
      thumbnail: newGuild.iconURL({ dynamic: true }),
      fields: [
        { name: '📋 Changes', value: changes.join('\n'), inline: false },
      ],
      footer: `Guild ID: ${newGuild.id}`
    });
  }
};

// Export all as array
module.exports = [
  channelCreate, channelDelete, channelUpdate,
  threadCreate, threadDelete,
  roleCreate, roleDelete, roleUpdate,
  guildUpdate
];
