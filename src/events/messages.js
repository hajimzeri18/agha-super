const { sendLog } = require('../utils/logger');


// ───────── MESSAGE DELETE ─────────
const deletedEvent = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild) return;
    if (message.author?.bot) return;

    await sendLog(client, message.guild.id, 'message_deleted', {
      author: {
        name: message.author.username,
        iconURL: message.author.displayAvatarURL({ dynamic: true })
      },

      description:
        `🗑 **Message sent by ${message.author} deleted in ${message.channel}.**\n\n` +
        `${message.content || "*No content (embed/attachment)*"}`,

      footer: `${message.guild.name} • Today`
    });
  }
};



// ───────── MESSAGE EDIT ─────────
const editedEvent = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {

    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    await sendLog(client, newMessage.guild.id, 'message_edited', {
      author: {
        name: newMessage.author.username,
        iconURL: newMessage.author.displayAvatarURL({ dynamic: true })
      },

      description:
        `✏️ **Message sent by ${newMessage.author} edited in ${newMessage.channel}.**\n` +
        `[Jump to Message](${newMessage.url})\n\n` +
        `**Old**\n` +
        `\`\`\`\n${oldMessage.content || "Not cached"}\n\`\`\`\n\n` +
        `**New**\n` +
        `\`\`\`\n${newMessage.content || "Empty"}\n\`\`\``,

      footer: `${newMessage.guild.name} • Today`
    });
  }
};


module.exports = [deletedEvent, editedEvent];
