const { handleAntiInvite } = require('../utils/antiInvite');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    await handleAntiInvite(message, client);
  }
};
