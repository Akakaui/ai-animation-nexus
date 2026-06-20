const { getUnlockedSessions } = require('../../lib/db');

module.exports = async (req, res) => {
  const sessions = await getUnlockedSessions();
  res.json({ sessions });
};
