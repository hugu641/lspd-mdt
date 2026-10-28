const { logMessageDelete } = require('../utils/logsManager');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    await logMessageDelete(message);
  }
};
