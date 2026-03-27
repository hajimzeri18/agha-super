const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {

    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guild = newState.guild || oldState.guild;
    const guildId = guild.id;

    const oldCh = oldState.channel;
    const newCh = newState.channel;

    // ───────── JOIN ─────────
    if (!oldCh && newCh) {

      await sendLog(client, guildId, 'voice_join', {
        author: {
          name: member.user.username,
          iconURL: member.user.displayAvatarURL({ dynamic: true })
        },
        description: `**${member} joined voice channel > ${newCh}**`
      });

      return;
    }

    // ───────── LEAVE (SELF ONLY) ─────────
    if (oldCh && !newCh) {

      await sendLog(client, guildId, 'voice_leave', {
        author: {
          name: member.user.username,
          iconURL: member.user.displayAvatarURL({ dynamic: true })
        },
        description: `**${member} left voice channel > ${oldCh}**`
      });

      return;
    }

    // ───────── SWITCH ─────────
    if (oldCh && newCh && oldCh.id !== newCh.id) {

      await sendLog(client, guildId, 'voice_switch', {
        author: {
          name: member.user.username,
          iconURL: member.user.displayAvatarURL({ dynamic: true })
        },
        description: `**${member} switched voice channel 🔊**`,
        fields: [
          { name: '**From**', value: `${oldCh}`, inline: true },
          { name: '**To**', value: `${newCh}`, inline: true }
        ],
        thumbnail: member.user.displayAvatarURL({ dynamic: true }),
        footer: `User ID: ${member.id}`
      });

      return;
    }

    // ───────── SERVER MUTE ─────────
    if (oldState.serverMute !== newState.serverMute) {

      await sendLog(client, guildId, 'voice_switch', {
        author: {
          name: member.user.username,
          iconURL: member.user.displayAvatarURL({ dynamic: true })
        },
        description:
          `**Voice state updated for ${member}**\n\n` +
          `**🎙 Server Mute:** **${newState.serverMute ? "True" : "False"}**`
      });

      return;
    }

    // ───────── SERVER DEAF ─────────
    if (oldState.serverDeaf !== newState.serverDeaf) {

      await sendLog(client, guildId, 'voice_switch', {
        author: {
          name: member.user.username,
          iconURL: member.user.displayAvatarURL({ dynamic: true })
        },
        description:
          `**Voice state updated for ${member}**\n\n` +
          `**🔇 Server Deaf:** **${newState.serverDeaf ? "True" : "False"}**`
      });

      return;
    }

  }
};
