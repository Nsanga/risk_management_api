const actionService = require("../services/action.service");

async function createAction(req, res) {
  await actionService.createAction(req, res);
}

async function getAllAction(req, res) {
  return await actionService.getAllAction(req, res);
}
async function getAllActionByEntity(req, res) {
  return await actionService.getAllActionByEntity(req, res);
}

async function getAllActionByControl(req, res) {
  return await actionService.getAllActionByControl(req, res);
}

async function getAllActionByReference(req, res) {
  return await actionService.getAllActionByReference(req, res);
}

async function getDataRapport(req, res) {
  return await actionService.getDataRapport(req, res);
}

async function updateAction(req, res) {
  return await actionService.updateAction(req, res);
}

module.exports = {
  createAction,
  getAllAction,
  getAllActionByControl,
  getAllActionByEntity,
  getAllActionByReference,
  getDataRapport,
  updateAction,
};
