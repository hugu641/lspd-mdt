const { logMessageUpdate } = require('../utils/logsManager');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    await logMessageUpdate(oldMessage, newMessage);
  }
};
