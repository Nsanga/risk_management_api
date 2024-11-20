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

  async getEntityRiskControlsByEntityName() {
    try {
      // Récupère toutes les données en peuplant les informations de l'entité
      const data = await EntityRiskControl.find()
        .populate('entity') // Peuple le champ 'entity' avec les détails de l'entité associée
        .exec();

      // Formate les données pour être plus lisibles
      const formattedData = data.map(doc => ({
        entity: {
          referenceId: doc.entity.referenceId,
          description: doc.entity.description,
          ram: doc.entity.ram,
          location: doc.entity.location,
          businessLine: doc.entity.businessLine,
        },
        risks: doc.risks,
        controls: doc.controls
      }));

      console.log('Données récupérées de la base de données:', formattedData);
      return formattedData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error.message);
      throw new Error('Impossible de récupérer les données.');
    }
  }
  async copyRiskOrControl(itemId, targetEntityId, itemType = 'risk') {
    try {
      // Récupérer l'entité source contenant le risque ou le contrôle
      const sourceEntity = await EntityRiskControl.findOne({
        [itemType === 'risk' ? 'risks._id' : 'controls._id']: itemId
      });

      if (!sourceEntity) {
        throw new Error(`${itemType} avec l'ID ${itemId} non trouvé dans la base de données.`);
      }

      // Trouver le risque ou le contrôle spécifique dans l'entité source
      const item = sourceEntity[itemType === 'risk' ? 'risks' : 'controls'].id(itemId);

      if (!item) {
        throw new Error(`${itemType} avec l'ID ${itemId} non trouvé.`);
      }

      // Récupérer le nombre de risques/contrôles pour générer une nouvelle référence
      const count = await EntityRiskControl.countDocuments({
        entity: targetEntityId,
        [itemType === 'risk' ? 'risks' : 'controls']: { $exists: true }
      });

      // Générer une nouvelle référence pour l'élément copié
      const newReferenceNumber = this.generateReference(itemType === 'risk' ? 'RSK' : 'CTR', count + 1);

      // Créer une copie de l'élément avec la nouvelle référence et le `referenceNumber`
      const copiedItem = {
        ...item.toObject(),
        _id: new mongoose.Types.ObjectId(), // Nouveau ID pour éviter les conflits
        referenceNumber: newReferenceNumber, // Assurez-vous que `referenceNumber` est défini ici
      };

      // Ajouter l'élément copié dans la nouvelle entité
      const targetEntity = await EntityRiskControl.findOneAndUpdate(
        { entity: targetEntityId },
        { $push: { [itemType === 'risk' ? 'risks' : 'controls']: copiedItem } },
        { new: true, upsert: true }
      );

      return {
        message: `${itemType} copié avec succès vers l'entité cible.`,
        targetEntity
      };

    } catch (error) {
      console.error('Erreur lors de la copie du risque/contrôle :', error.message);
      throw error;
    }
  }

  // Fonction pour déplacer un risque ou un contrôle vers une autre entité
  async moveRiskOrControl(itemId, targetEntityId, itemType = 'risk') {
    try {
      // Copier l'élément vers la nouvelle entité
      const copyResult = await this.copyRiskOrControl(itemId, targetEntityId, itemType);

      // Supprimer l'élément de l'entité d'origine
      await EntityRiskControl.findOneAndUpdate(
        { [itemType === 'risk' ? 'risks._id' : 'controls._id']: itemId },
        { $pull: { [itemType === 'risk' ? 'risks' : 'controls']: { _id: itemId } } }
      );

      return {
        message: `${itemType} déplacé avec succès vers l'entité cible.`,
        targetEntity: copyResult.targetEntity
      };

    } catch (error) {
      console.error('Erreur lors du déplacement du risque/contrôle :', error.message);
      throw error;
    }
  }
}

module.exports = ExcelService;
