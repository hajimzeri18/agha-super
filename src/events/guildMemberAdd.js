const { sendLog } = require('../utils/logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {

    await sendLog(client, member.guild.id, 'member_joined', {
      author: {
        name: member.user.username,
        iconURL: member.user.displayAvatarURL({ dynamic: true })
      },
      description: ` ${member.user} **joined the server.**`,
      thumbnail: member.user.displayAvatarURL({ dynamic: true, size: 1024 }),
      fields: [
        {
          name: '📅 Account Created:',
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>)`,
          inline: false
        }
      ],
      footer: `User ID: ${member.user.id}`
    });

  }
};
