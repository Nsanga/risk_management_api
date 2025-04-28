const historiqueKRIservice = require("../services/historyKRI.service");

async function createHistoryKRI(req, res) {
  await historiqueKRIservice.createHistoryKRI(req, res);
}

async function getAllHistoriqueKri(req, res) {
  return await historiqueKRIservice.getAllHistoriqueKri(req, res);
}

module.exports = {
  createHistoryKRI,
  getAllHistoriqueKri,
};
