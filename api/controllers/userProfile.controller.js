const profileService = require('../services/userprofile.service');

async function createProfile(req, res) {
  await profileService.createProfile(req, res);
}

async function getProfileById(req, res) {
  return await profileService.getProfileById(req, res);
}

async function updateProfile(req, res) {
  return await profileService.updateProfile(req, res);
}

async function deleteProfile(req, res) {
  return await profileService.deleteProfile(req, res);
}

async function getAllProfiles(req, res) {
  return await profileService.getAllProfiles(req, res);
}

module.exports = {
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  getAllProfiles,
};
