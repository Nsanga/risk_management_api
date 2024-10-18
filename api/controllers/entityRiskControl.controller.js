const entityRiskControlService = require('../services/entityRiskControl.service');

async function createEntityRiskControl(req, res) {
  await entityRiskControlService.createEntityRiskControl(req, res);
}

async function getEntityRiskControlById(req, res) {
  return await entityRiskControlService.getEntityRiskControlById(req, res);
}

async function updateEntityRiskControl(req, res) {
  return await entityRiskControlService.updateEntityRiskControl(req, res);
}

async function deleteEntityRiskControl(req, res) {
  return await entityRiskControlService.deleteEntityRiskControl(req, res);
}

async function getAllEntityRiskControls(req, res) {
  return await entityRiskControlService.getAllEntityRiskControls(req, res);
}

module.exports = {
  createEntityRiskControl,
  getEntityRiskControlById,
  updateEntityRiskControl,
  deleteEntityRiskControl,
  getAllEntityRiskControls,
};
