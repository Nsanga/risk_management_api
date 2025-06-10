const StatsService = require("../services/stats.service");

async function getStats(req, res) {
  return await StatsService.getStatistics(req, res);
}

module.exports = {
  getStats,
};
