const EntityRiskControl = require('../models/entityRiskControl.model'); // Importation du modèle RiskControl
const ResponseService = require('../services/response.service'); // Un service pour gérer les réponses

let currentRiskNumber = 1; // Point de départ pour riskRef
let currentControlNumber = 1; // Point de départ pour controlRef
let currentRefNumber = 1; // Point de départ pour le champ ref

function generateReferenceNumber(currentNumber) {
  if (currentNumber > 99999) {
    // Réinitialiser à 1 si la limite de 99999 est atteinte
    currentNumber = 1;
  }

  const referenceNumber = currentNumber.toString().padStart(5, '0');
  return referenceNumber;
}

async function createEntityRiskControl(req, res) {
  try {
    
    const entityRiskControlData = req.body;
    const { entity } = entityRiskControlData; // Extraire l'entité des données

    // Générer les numéros de référence pour riskRef, controlRef et ref unique
    const riskRef = generateReferenceNumber(currentRiskNumber);
    const controlRef = generateReferenceNumber(currentControlNumber);
    const ref = generateReferenceNumber(currentRefNumber);

    // Incrémenter les numéros de référence pour les prochaines créations
    currentRiskNumber++;
    currentControlNumber++;
    currentRefNumber++;

    // Ajouter les références générées aux données
    entityRiskControlData.riskRef = riskRef;
    entityRiskControlData.controlRef = controlRef;
    entityRiskControlData.ref = ref; // Ajout du champ ref unique pour ce contrôle

    // Créer et sauvegarder un nouveau RiskControl même si un contrôle pour la même entité existe
    const newEntityRiskControl = new EntityRiskControl({ entityRiskControlData });
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
    const entityRiskControl = await EntityRiskControl.findById({ entityRiskControlId });
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
    let updatedData = req.body;

    // Convertir les champs `owner`, `nominee`, `reviewer` à `null` si la valeur est une chaîne vide
    const convertEmptyStringToNull = (obj, fields) => {
      fields.forEach(field => {
        if (obj[field] === "") {
          obj[field] = null;
        }
      });
    };

    // Vérifier et convertir les champs pour les risques
    if (updatedData.risks) {
      convertEmptyStringToNull(updatedData.risks, ['owner', 'nominee', 'reviewer']);
    }

    // Vérifier et convertir les champs pour les contrôles
    if (updatedData.controls) {
      convertEmptyStringToNull(updatedData.controls, ['owner', 'nominee', 'reviewer']);
    }

    // Mettre à jour l'EntityRiskControl avec les nouvelles données
    const entityRiskControl = await EntityRiskControl.findByIdAndUpdate(entityRiskControlId,  updatedData, { new: true });

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
    const entityRiskControl = await EntityRiskControl.findByIdAndDelete({ entityRiskControlId });
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
