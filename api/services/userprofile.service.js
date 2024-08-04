const UserProfile = require('../models/userProfile.model');
const ResponseService = require('./response.service');
const UploadService = require('./uploadFile.service');

async function createProfile(req, res) {
  try {
    const profileData = req.body;

    const newUserProfile = new UserProfile(profileData);
    await newUserProfile.save();

    return ResponseService.created(res, newUserProfile);
  } catch (error) {
    console.error('Error creating Profile:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getProfileById(req, res) {
  try {
    const profileId = req.params.id;
    const profile = await UserProfile.findById(profileId);
    if (!profile) {
      return ResponseService.notFound(res, { message: 'Profil non trouvé' });
    }
    return ResponseService.success(res, { profile });
  } catch (error) {
    console.error('Erreur lors de la récupération du Profil:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function updateProfile(req, res) {
  try {
    const profileId = req.params.id;
    const updatedData = req.body;

    const profile = await UserProfile.findByIdAndUpdate(profileId, updatedData, { new: true });

    if (!profile) {
      return ResponseService.notFound(res, { message: 'Profile not found' });
    }

    return ResponseService.success(res, { message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Error updating Profile:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function deleteProfile(req, res) {
  try {
    const profileId = req.params.id;
    const profile = await UserProfile.findByIdAndDelete(profileId);
    if (!profile) {
      return ResponseService.notFound(res, { message: 'Profil non trouvé' });
    }
    return ResponseService.success(res, { message: 'Profil supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du Profil:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getAllProfiles(req, res) {
  try {
    const profiles = await UserProfile.find();
    return ResponseService.success(res, { profiles });
  } catch (error) {
    console.error('Erreur lors de la récupération des Profils:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

module.exports = {
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
  getAllProfiles,
};
