const UserGroup = require('../models/userGroup.model');
const ResponseService = require('./response.service');

async function createUserGroup(req, res) {
  try {
    const tenantId = req.body.tenantId;
    const userGroupData = req.body;

    const newUserGroup = new UserGroup({ userGroupData, tenantId });
    await newUserGroup.save();

    return ResponseService.created(res, { message: 'user group created successfully', newUserGroup });
  } catch (error) {
    console.error('Error creating user group:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getUserGroupById(req, res) {
  try {
    const tenantId = req.body.tenantId;
    const userGroupId = req.params.id;
    const userGroup = await UserGroup.findById({ userGroupId, tenantId });
    if (!userGroup) {
      return ResponseService.notFound(res, { message: 'Groupe utilisateur non trouvé' });
    }
    return ResponseService.success(res, { userGroup });
  } catch (error) {
    console.error('Erreur lors de la récupération du groupe utilisateur:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function updateUserGroup(req, res) {
  try {
    const tenantId = req.body.tenantId;
    const userGroupId = req.params.id;
    const updatedData = req.body;

    const userGroup = await UserGroup.findByIdAndUpdate(userGroupId, tenantId, updatedData, { new: true });

    if (!userGroup) {
      return ResponseService.notFound(res, { message: 'UserGroup not found' });
    }

    return ResponseService.success(res, { message: 'User group updated successfully', userGroup });
  } catch (error) {
    console.error('Error updating User group:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function deleteUserGroup(req, res) {
  try {
    const tenantId = req.body.tenantId;
    const userGroupId = req.params.id;
    const userGroup = await UserGroup.findByIdAndDelete(userGroupId, tenantId);
    if (!userGroup) {
      return ResponseService.notFound(res, { message: 'Groupe utilisateur non trouvé' });
    }
    return ResponseService.success(res, { message: 'Groupe utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du Groupe utilisateur:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getAllUserGroups(req, res) {
  try {
    const tenantId = req.body.tenantId;
    const userGroups = await UserGroup.find({ tenantId });
    return ResponseService.success(res, { userGroups });
  } catch (error) {
    console.error('Erreur lors de la récupération des Groupes utilisateurs:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

module.exports = {
  createUserGroup,
  getUserGroupById,
  updateUserGroup,
  deleteUserGroup,
  getAllUserGroups,
};