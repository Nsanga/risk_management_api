const userGroupService = require('../services/userGroup.service');

async function createUserGroup(req, res) {
  await userGroupService.createUserGroup(req, res);
}

async function getUserGroupById(req, res) {
  return await userGroupService.getUserGroupById(req, res);
}

async function updateUserGroup(req, res) {
  return await userGroupService.updateUserGroup(req, res);
}

async function deleteUserGroup(req, res) {
  return await userGroupService.deleteUserGroup(req, res);
}

async function getAllUserGroups(req, res) {
  return await userGroupService.getAllUserGroups(req, res);
}

module.exports = {
  createUserGroup,
  getUserGroupById,
  updateUserGroup,
  deleteUserGroup,
  getAllUserGroups,
};
