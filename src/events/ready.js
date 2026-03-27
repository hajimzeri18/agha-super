module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    client.user.setActivity('your server 👁️', { type: 3 }); // Watching
  }
};
