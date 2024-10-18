const EntityRiskControl = require('../models/entityRiskControlSchema.model'); // Importation du modèle RiskControl
const ResponseService = require('../services/response.service'); // Un service pour gérer les réponses

async function createEntityRiskControl(req, res) {
  try {
    const EntityRiskControlData = req.body;

    // Créer et sauvegarder un nouveau RiskControl
    const newEntityRiskControl = new EntityRiskControl(EntityRiskControlData);
    await newEntityRiskControl.save();

    return ResponseService.created(res, { message: 'RiskControl créé avec succès', newEntityRiskControl });
  } catch (error) {
    console.error('Erreur lors de la création du RiskControl:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getEntityRiskControlById(req, res) {
  try {
    const entityRiskControlId = req.params.id;

    // Récupérer un RiskControl par son ID
    const entityRiskControl = await EntityRiskControl.findById(entityRiskControlId);
    if (!entityRiskControl) {
      return ResponseService.notFound(res, { message: 'RiskControl non trouvé' });
    }

    return ResponseService.success(res, { entityRiskControl });
  } catch (error) {
    console.error('Erreur lors de la récupération du RiskControl:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function updateEntityRiskControl(req, res) {
  try {
    const entityRiskControlId = req.params.id;
    const updatedData = req.body;

    // Mettre à jour le RiskControl
    const entityRiskControl = await EntityRiskControl.findByIdAndUpdate(entityRiskControlId, updatedData, { new: true });

    if (!entityRiskControl) {
      return ResponseService.notFound(res, { message: 'EntityRiskControl non trouvé' });
    }

    return ResponseService.success(res, { message: 'EntityRiskControl mis à jour avec succès', entityRiskControl });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du EntityRiskControl:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function deleteEntityRiskControl(req, res) {
  try {
    const entityRiskControlId = req.params.id;

    // Supprimer un RiskControl par son ID
    const entityRiskControl = await EntityRiskControl.findByIdAndDelete(entityRiskControlId);
    if (!entityRiskControl) {
      return ResponseService.notFound(res, { message: 'EntityRiskControl non trouvé' });
    }

    return ResponseService.success(res, { message: 'EntityRiskControl supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du EntityRiskControl:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getAllEntityRiskControls(req, res) {
  try {
    // Récupérer tous les EntityRiskControl
    const entityRiskControl = await EntityRiskControl
    .find({ entity: entityId })
    .populate({
      path: 'riskControl',
      populate: {
        path: 'risk control' // Récupère à la fois les détails de risque et contrôle
      }
    });
    return ResponseService.success(res, { entityRiskControl });
  } catch (error) {
    console.error('Erreur lors de la récupération des RiskControls:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

module.exports = {
  createEntityRiskControl,
  getEntityRiskControlById,
  updateEntityRiskControl,
  deleteEntityRiskControl,
  getAllEntityRiskControls,
};
