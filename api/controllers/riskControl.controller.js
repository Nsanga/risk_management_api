const riskControlService = require('../services/riskControl.service'); // Assurez-vous que le chemin est correct

async function createRiskControl(req, res) {
  return await riskControlService.createRiskControl(req, res);
}

async function getRiskControlById(req, res) {
  return await riskControlService.getRiskControlById(req, res);
}

async function updateRiskControl(req, res) {
  return await riskControlService.updateRiskControl(req, res);
}

async function deleteRiskControl(req, res) {
  return await riskControlService.deleteRiskControl(req, res); 
}

async function getAllRiskControls(req, res) {
  return await riskControlService.getAllRiskControls(req, res);
}

module.exports = {
  createRiskControl,
  getRiskControlById,
  updateRiskControl,
  deleteRiskControl,
  getAllRiskControls,
};
