const RiskControl = require('../models/riskControl.model'); // Importation du modèle RiskControl
const ResponseService = require('../services/response.service'); // Un service pour gérer les réponses

async function createRiskControl(req, res) {
  try {
    const riskControlData = req.body;

    // Créer et sauvegarder un nouveau RiskControl
    const newRiskControl = new RiskControl(riskControlData);
    await newRiskControl.save();

    return ResponseService.created(res, { message: 'RiskControl créé avec succès', newRiskControl });
  } catch (error) {
    console.error('Erreur lors de la création du RiskControl:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getRiskControlById(req, res) {
  try {
    const riskControlId = req.params.id;

    // Récupérer un RiskControl par son ID
    const riskControl = await RiskControl.findById(riskControlId);
    if (!riskControl) {
      return ResponseService.notFound(res, { message: 'RiskControl non trouvé' });
    }

    return ResponseService.success(res, { riskControl });
  } catch (error) {
    console.error('Erreur lors de la récupération du RiskControl:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function updateRiskControl(req, res) {
  try {
    const riskControlId = req.params.id;
    const updatedData = req.body;

    // Mettre à jour le RiskControl
    const riskControl = await RiskControl.findByIdAndUpdate(riskControlId, updatedData, { new: true });

    if (!riskControl) {
      return ResponseService.notFound(res, { message: 'RiskControl non trouvé' });
    }

    return ResponseService.success(res, { message: 'RiskControl mis à jour avec succès', riskControl });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du RiskControl:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function deleteRiskControl(req, res) {
  try {
    const riskControlId = req.params.id;

    // Supprimer un RiskControl par son ID
    const riskControl = await RiskControl.findByIdAndDelete(riskControlId);
    if (!riskControl) {
      return ResponseService.notFound(res, { message: 'RiskControl non trouvé' });
    }

    return ResponseService.success(res, { message: 'RiskControl supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du RiskControl:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getAllRiskControls(req, res) {
  try {
    // Récupérer tous les RiskControls
    const riskControls = await RiskControl.find();
    return ResponseService.success(res, { riskControls });
  } catch (error) {
    console.error('Erreur lors de la récupération des RiskControls:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

module.exports = {
  createRiskControl,
  getRiskControlById,
  updateRiskControl,
  deleteRiskControl,
  getAllRiskControls,
};
