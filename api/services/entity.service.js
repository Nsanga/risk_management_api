const Entity = require('../models/entity.model');
const ResponseService = require('./response.service');
const UploadService = require('./uploadFile.service');

function generateReferenceNumber() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createEntity(req, res) {
  try {
    // Obtenir le dernier entity enregistré pour calculer le prochain referenceId
    const lastEntity = await Entity.findOne().sort({ referenceId: -1 }).exec();

    // Calculer le prochain numéro de référence
    let nextReferenceId = '001';
    if (lastEntity && lastEntity.referenceId) {
      const lastReferenceId = parseInt(lastEntity.referenceId, 10);
      const newReferenceId = lastReferenceId + 1;
      nextReferenceId = String(newReferenceId).padStart(3, '0');
    }

    // Ajouter le referenceId à l'objet entityData
    const entityData = {
      ...req.body,
      referenceId: nextReferenceId
    };

    // Créer et sauvegarder la nouvelle entité
    const newEntity = new Entity(entityData);
    await newEntity.save();

    // Retourner la réponse avec succès
    return ResponseService.created(res, newEntity);
  } catch (error) {
    console.error('Error creating entity:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getEntityById(req, res) {
  try {
    const entityId = req.params.id;
    const entity = await Entity.findById(entityId);
    if (!entity) {
      return ResponseService.notFound(res, { message: 'Événement non trouvé' });
    }
    return ResponseService.success(res, { entity });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function updateEntity(req, res) {
  try {
    const entityId = req.params.id;
    const updatedData = req.body;

    const entity = await Entity.findByIdAndUpdate(entityId, updatedData, { new: true });

    if (!entity) {
      return ResponseService.notFound(res, { message: 'Entity not found' });
    }

    return ResponseService.success(res, { message: 'Entity updated successfully', entity });
  } catch (error) {
    console.error('Error updating entity:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function deleteEntity(req, res) {
  try {
    const entityId = req.params.id;
    const entity = await Entity.findByIdAndDelete(entityId);
    if (!entity) {
      return ResponseService.notFound(res, { message: 'Entité non trouvé' });
    }
    return ResponseService.success(res, { message: 'Entité supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'entité:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getAllEntities(req, res) {
  try {
    const entities = await Entity.find();
    return ResponseService.success(res, { entities });
  } catch (error) {
    console.error('Erreur lors de la récupération des entités:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

module.exports = {
  createEntity,
  getEntityById,
  updateEntity,
  deleteEntity,
  getAllEntities,
};
