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

  async copyRiskOrControl(itemId, targetEntityId, type = 'risk') {
    try {
      // Vérifie que l'entité cible existe
      const targetEntity = await Entity.findById(targetEntityId);
      if (!targetEntity) {
        throw new Error("Entité cible introuvable.");
      }

      // Recherche de l'élément à copier (risque ou contrôle)
      const item = await EntityRiskControl.findOne({ [`${type}s._id`]: itemId });
      if (!item) {
        throw new Error(`${type === 'risk' ? 'Risque' : 'Contrôle'} introuvable.`);
      }

      // Trouve l'élément spécifique
      const itemToCopy = item[`${type}s`].id(itemId);
      if (!itemToCopy) {
        throw new Error(`Élément ${type === 'risk' ? 'risque' : 'contrôle'} non trouvé.`);
      }

      // Crée une copie de l'élément
      const copiedItem = {
        ...itemToCopy.toObject(),
        reference: this.generateRandomReference(type === 'risk' ? 'RSK' : 'CTR', Date.now()), // Nouveau `reference`
        businessFunction: targetEntity.description,
        _id: new mongoose.Types.ObjectId(), // Génère un nouvel ID
      };

      // Ajoute la copie à l'entité cible
      let targetEntityRiskControl = await EntityRiskControl.findOne({ entity: targetEntityId });
      if (!targetEntityRiskControl) {
        // Crée une nouvelle entrée si aucune n'existe pour l'entité cible
        targetEntityRiskControl = new EntityRiskControl({
          entity: targetEntityId,
          risks: type === 'risk' ? [copiedItem] : [],
          controls: type === 'control' ? [copiedItem] : [],
        });
      } else {
        // Ajoute la copie à l'entrée existante
        targetEntityRiskControl[`${type}s`].push(copiedItem);
      }
      await targetEntityRiskControl.save();

      return {
        success: true,
        message: `${type === 'risk' ? 'Risque' : 'Contrôle'} copié avec succès.`,
        data: copiedItem,
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

  async moveRiskOrControl(itemId, targetEntityId, type = 'risk') {
    try {
      // Vérifie que l'entité cible existe
      const targetEntity = await Entity.findById(targetEntityId);
      if (!targetEntity) {
        throw new Error('Entité cible introuvable');
      }

      // Recherche de l'entité source contenant l'élément à déplacer
      const item = await EntityRiskControl.findOne({
        [`${type}s._id`]: itemId,
      });

      if (!item) {
        throw new Error(`${type === 'risk' ? 'Risque' : 'Contrôle'} introuvable`);
      }

      // Trouve l'élément à déplacer
      const itemToMove = item[`${type}s`].find(({ _id }) => _id.toString() === itemId);
      if (!itemToMove) {
        throw new Error(`${type === 'risk' ? 'Risque' : 'Contrôle'} non trouvé dans l'entité source`);
      }

      // Supprime l'élément de l'entité actuelle
      item[`${type}s`] = item[`${type}s`].filter(({ _id }) => _id.toString() !== itemId);
      await item.save();

      // Met à jour le champ businessFunction avec la description de l'entité cible
      itemToMove.businessFunction = targetEntity.description;

      // Ajoute l'élément à la nouvelle entité
      const targetEntityRiskControl = await EntityRiskControl.findOne({ entity: targetEntityId });
      if (!targetEntityRiskControl) {
        // Crée une nouvelle entrée si aucune n'existe pour l'entité cible
        const newEntry = new EntityRiskControl({
          entity: targetEntityId,
          risks: type === 'risk' ? [itemToMove] : [],
          controls: type === 'control' ? [itemToMove] : [],
        });
        await newEntry.save();
      } else {
        // Ajoute l'élément à l'entrée existante
        targetEntityRiskControl[`${type}s`].push(itemToMove);
        await targetEntityRiskControl.save();
      }

      return {
        success: true,
        message: `${type === 'risk' ? 'Risque' : 'Contrôle'} déplacé avec succès`,
      };
    } catch (error) {
      console.error('Erreur lors du déplacement :', error.message);
      return {
        success: false,
        message: 'Erreur lors du déplacement',
        error: error.message,
      };
    }
  }
}

module.exports = ExcelService;
