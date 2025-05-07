const actionKRIService = require("../services/actionKRI.service");

async function createActionKRI(req, res) {
  await actionKRIService.createActionKRI(req, res);
}

async function getAllActionByIdKeyIndicator(req, res) {
  await actionKRIService.getAllActionByIdKeyIndicator(req, res);
}

async function getAllActionKRI(req, res) {
  await actionKRIService.getAllActionKRI(req, res);
}

module.exports = {
  getAllActionByIdKeyIndicator,
  createActionKRI,
  getAllActionKRI,
};
