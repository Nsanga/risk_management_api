const entityService = require('../services/entity.service');

async function createEntity(req, res) {
  await entityService.createEntity(req, res);
}

async function getEntityById(req, res) {
  return await entityService.getEntityById(req, res);
}

async function updateEntity(req, res) {
  return await entityService.updateEntity(req, res);
}

async function deleteEntity(req, res) {
  return await entityService.deleteEntity(req, res);
}

async function getAllEntities(req, res) {
  return await entityService.getAllEntities(req, res);
}

module.exports = {
  createEntity,
  getEntityById,
  updateEntity,
  deleteEntity,
  getAllEntities,
};
