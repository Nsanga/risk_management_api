const XLSX = require('xlsx');
const Entity = require('../models/entity.model');
const EntityRiskControl = require('../models/entityRiskControl.model');
const mongoose = require('mongoose');

class ExcelService {
  constructor(file) {
    this.file = file; // Assurez-vous que le fichier est passé ici
  }

  generateReference(prefix, count) {
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  generateRandomReference(prefix, timestamp) {
    // Convertit le timestamp en un format unique mais limité à 5 chiffres
    const randomPart = String(timestamp).slice(-5); // Prend les 5 derniers chiffres du timestamp
    return `${prefix}${randomPart}`;
  }


  async readExcelFile() {
    try {
      const workbook = XLSX.read(this.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      await EntityRiskControl.deleteMany({});
      console.log("Anciennes données supprimées avec succès.");

      const riskTableStartIndex = data.findIndex(row => row[0] === 'TOP Risks') + 2;
      const riskTableEndIndex = data.findIndex((row, index) => index > riskTableStartIndex && row.length === 0);
      const riskData = data.slice(riskTableStartIndex, riskTableEndIndex > 0 ? riskTableEndIndex : undefined);

      const groupedData = {};
      let riskCount = 1;
      let controlCount = 1;

      for (const row of riskData) {
        const businessFunction = row[2];

        const entity = await Entity.findOne({ description: businessFunction });
        if (!entity) {
          console.log(`Entité non trouvée pour la description : ${businessFunction}`);
          continue;
        }

        const entityId = entity._id;

        const riskReference = this.generateReference('RSK', riskCount++);
        const controlReference = this.generateReference('CTR', controlCount++);

        const risk = {
          reference: riskReference,
          serialNumber: row[0],
          entityReference: entityId,
          businessFunction: row[2],
          description: row[3],
          outsourcedProcesses: row[4],
          riskCategory: row[5],
          riskEventCategory: row[6],
          causalCategory: row[7],
          riskSummary: row[8],
          riskDescription: row[9],
          occurrenceProbability: row[10],
          riskImpact: row[11],
          total: row[12],
          ownerRisk: row[13],
          nomineeRisk: row[14],
          reviewerRisk: row[15],
          riskLevel: row[16],
        };

        const control = {
          reference: controlReference,
          controlSummary: row[17],
          controlDescription: row[18],
          monitoringMethodology: row[19],
          controlRating: row[20],
          residualRiskLevel: row[21],
          preventiveDetectiveControl: row[22],
          monitoringCycle: row[23],
          documentSources: row[24],
          ownerControl: row[25],
          nomineeControl: row[26],
          reviewerControl: row[27],
          library: row[28],
          status: row[29],
        };

        if (!groupedData[entityId]) {
          groupedData[entityId] = { entity, risks: [], controls: [] };
        }

        groupedData[entityId].risks.push(risk);
        groupedData[entityId].controls.push(control);
      }

      const result = Object.values(groupedData).map(({ entity, risks, controls }) => ({
        entity: new mongoose.Types.ObjectId(entity._id), // Convertissez en ObjectId ici
        risks,
        controls,
      }));

      await EntityRiskControl.insertMany(result);

      console.log('Données sauvegardées dans la base de données avec succès.');
      return result;

    } catch (error) {
      console.error('Erreur lors de la lecture du fichier Excel :', error.message);
      return null;
    }
  }

  async getEntityRiskControlsByEntityName(entityName) {
    try {
      // Récupère l'entité par son nom
      const entity = await Entity.findOne({ description: entityName });
  
      if (!entity) {
        throw new Error(`Entité '${entityName}' introuvable`);
      }
  
      // Récupère les risques et contrôles associés à cette entité
      const data = await EntityRiskControl.find({ entity: entity._id })
        .populate('entity') // Peupler les détails de l'entité
        .exec();
  
      const formattedData = data.map(doc => ({
        entity: {
          referenceId: doc.entity.referenceId,
          description: doc.entity.description,
          ram: doc.entity.ram,
          location: doc.entity.location,
          businessLine: doc.entity.businessLine,
        },
        risks: doc.risks,
        controls: doc.controls,
      }));
  
      return formattedData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error.message);
      throw new Error('Impossible de récupérer les données pour l\'entité.');
    }
  }  

  async copyRiskOrControls(itemIds, targetEntityId, type = 'risk') {
    try {
      // Vérifie que l'entité cible existe
      const targetEntity = await Entity.findById(targetEntityId);
      if (!targetEntity) {
        throw new Error("Entité cible introuvable.");
      }
  
      // Recherche l'entité de contrôle des risques associée à l'entité cible
      let targetEntityRiskControl = await EntityRiskControl.findOne({ entity: targetEntityId });
  
      if (!targetEntityRiskControl) {
        // Crée une nouvelle entrée si aucune n'existe pour l'entité cible
        targetEntityRiskControl = new EntityRiskControl({
          entity: targetEntityId,
          risks: [],
          controls: [],
        });
      }
  
      // Assurez-vous que les propriétés sont des tableaux
      if (!Array.isArray(targetEntityRiskControl.controls)) {
        targetEntityRiskControl.controls = [];
      }
      if (!Array.isArray(targetEntityRiskControl.risks)) {
        targetEntityRiskControl.risks = [];
      }
  
      let copiedCount = 0; // Compteur d'éléments copiés
  
      // Parcourt tous les éléments à copier
      for (const itemId of itemIds) {
        // Cherche l'élément (risque ou contrôle) à copier
        const item = await EntityRiskControl.findOne({ [`${type}s._id`]: itemId });
  
        if (!item) {
          console.error(`${type === 'risk' ? 'Risque' : 'Contrôle'} introuvable.`);
          continue;
        }
  
        const itemToCopy = item[`${type}s`].id(itemId);
        if (!itemToCopy) {
          console.error(`Élément ${type === 'risk' ? 'risque' : 'contrôle'} non trouvé.`);
          continue;
        }
  
        // Vérifier si le risque/contrôle est déjà présent dans l'entité cible
        const alreadyExists = targetEntityRiskControl[`${type}s`].some(existingItem => 
          existingItem.description === itemToCopy.description); // Utilisez la référence ou un autre attribut unique
  
        if (alreadyExists) {
          // Si l'élément existe déjà, retournez cette réponse
          return {
            success: false,
            message: "Élément déjà existant",
            data: {},
          };
        }
  
        // Génère une nouvelle référence unique pour le risque/contrôle copié
        const newReference = this.generateRandomReference(
          type === 'risk' ? 'RSK' : 'CTR',
          Date.now()
        );
  
        if (!newReference) {
          throw new Error("La référence générée est invalide.");
        }
  
        // Prépare l'élément copié
        const copiedItem = {
          ...itemToCopy.toObject(),
          reference: newReference,
          businessFunction: targetEntity.description,
          _id: new mongoose.Types.ObjectId(),
        };
  
        // Ajout de l'élément (risque ou contrôle) à l'entité cible
        targetEntityRiskControl[`${type}s`].push(copiedItem);
        copiedCount++; // Augmente le compteur
      }
  
      // Sauvegarde les modifications dans la base de données si des éléments ont été copiés
      if (copiedCount > 0) {
        console.log(`${copiedCount} éléments ont été copiés.`);
        await targetEntityRiskControl.save();
      } else {
        console.log("Aucun élément n'a été copié.");
      }
  
      // Structure la réponse en fonction du succès de l'opération
      return {
        success: true,
        message: `Tous les ${type === 'risk' ? 'risques' : 'contrôles'} valides ont été copiés.`,
        data: targetEntityRiskControl,
      };
    } catch (error) {
      console.error("Erreur lors de la copie :", error.message);
      return {
        success: false,
        message: "Erreur lors de la copie.",
        error: error.message,
      };
    }
  }
  
  async moveRiskOrControls(itemIds, targetEntityId, type = 'risk') {
    try {
      // Vérifie que l'entité cible existe
      const targetEntity = await Entity.findById(targetEntityId);
      if (!targetEntity) {
        throw new Error("Entité cible introuvable.");
      }
  
      // Recherche l'entité de contrôle des risques associée à l'entité cible
      let targetEntityRiskControl = await EntityRiskControl.findOne({ entity: targetEntityId });
  
      if (!targetEntityRiskControl) {
        // Crée une nouvelle entrée si aucune n'existe pour l'entité cible
        targetEntityRiskControl = new EntityRiskControl({
          entity: targetEntityId,
          risks: [],
          controls: [],
        });
      }
  
      // Assurez-vous que les propriétés sont des tableaux
      if (!Array.isArray(targetEntityRiskControl.controls)) {
        targetEntityRiskControl.controls = [];
      }
      if (!Array.isArray(targetEntityRiskControl.risks)) {
        targetEntityRiskControl.risks = [];
      }
  
      let movedCount = 0; // Compteur d'éléments déplacés
      const errorItems = []; // Pour garder une trace des éléments non déplacés
  
      // Parcourt tous les éléments à déplacer
      for (const itemId of itemIds) {
        try {
          // Cherche l'élément (risque ou contrôle) à déplacer
          const item = await EntityRiskControl.findOne({ [`${type}s._id`]: itemId });
  
          if (!item) {
            console.error(`${type === 'risk' ? 'Risque' : 'Contrôle'} introuvable pour l'ID ${itemId}.`);
            errorItems.push(itemId); // Ajoute l'ID à la liste des erreurs
            continue; // Passe à l'élément suivant
          }
  
          const itemToMove = item[`${type}s`].id(itemId);
          if (!itemToMove) {
            console.error(`Élément ${type === 'risk' ? 'risque' : 'contrôle'} non trouvé pour l'ID ${itemId}.`);
            errorItems.push(itemId); // Ajoute l'ID à la liste des erreurs
            continue; // Passe à l'élément suivant
          }
  
          // Vérifier si le risque/contrôle est déjà présent dans l'entité cible
          const alreadyExists = targetEntityRiskControl[`${type}s`].some(existingItem => 
            existingItem.reference === itemToMove.reference); // Utilisez la référence ou un autre attribut unique
  
          if (alreadyExists) {
            // Si l'élément existe déjà dans l'entité cible, retournez cette réponse
            console.log(`${type === 'risk' ? 'Risque' : 'Contrôle'} déjà existant dans l'entité cible.`);
            errorItems.push(itemId); // Ajoute l'ID à la liste des erreurs
            continue; // Passe à l'élément suivant
          }
  
          // Prépare l'élément à déplacer
          const movedItem = {
            ...itemToMove.toObject(),
            _id: new mongoose.Types.ObjectId(), // Création d'un nouvel ID pour l'entité cible si nécessaire
          };
  
          // Ajoute l'élément dans l'entité cible
          targetEntityRiskControl[`${type}s`].push(movedItem);
          movedCount++; // Incrémente le compteur
  
          // Supprime l'élément de l'entité source (déplacement)
          item[`${type}s`] = item[`${type}s`].filter(el => el._id.toString() !== itemId.toString());
          await item.save();
        } catch (err) {
          console.error("Erreur lors du traitement de l'élément :", err);
          errorItems.push(itemId); // En cas d'erreur, on garde la trace de l'ID
        }
      }
  
      // Sauvegarde les modifications dans la base de données si des éléments ont été déplacés
      if (movedCount > 0) {
        console.log(`${movedCount} éléments ont été déplacés.`);
        await targetEntityRiskControl.save();
      } else {
        console.log("Aucun élément n'a été déplacé.");
      }
  
      // Retourner les résultats
      return {
        success: true,
        message: `Tous les ${type === 'risk' ? 'risques' : 'contrôles'} ont été déplacés avec succès.`,
        data: targetEntityRiskControl,
        errorItems, // Retourner les éléments qui n'ont pas pu être déplacés
      };
    } catch (error) {
      console.error("Erreur lors du déplacement :", error.message);
      return {
        success: false,
        message: "Erreur lors du déplacement des éléments.",
        error: error.message,
      };
    }
  }
  
  }

module.exports = ExcelService;
