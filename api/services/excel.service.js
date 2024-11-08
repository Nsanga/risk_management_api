const XLSX = require('xlsx');
const Entity = require('../models/entity.model');
const EntityRiskControl = require('../models/entityRiskControl.model');

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

      console.log('Données extraites du fichier Excel :', data);

      // Supprimez toutes les données existantes de la collection EntityRiskControl
      await EntityRiskControl.deleteMany({});
      console.log("Anciennes données supprimées avec succès.");

      // Trouver le début et la fin du tableau `TOP Risks`
      const riskTableStartIndex = data.findIndex(row => row[0] === 'TOP Risks') + 2;
      const riskTableEndIndex = data.findIndex((row, index) => index > riskTableStartIndex && row.length === 0);
      const riskData = data.slice(riskTableStartIndex, riskTableEndIndex > 0 ? riskTableEndIndex : undefined);

      // Initialiser l'objet de regroupement
      const groupedData = {};

      let riskCount = 1;
      let controlCount = 1;

      // Parcourir chaque ligne de `riskData`
      for (const row of riskData) {
        const businessFunction = row[2]; // Champ businessFunction dans le fichier Excel

        // Recherchez l'entité correspondante dans la base de données par description
        const entity = await Entity.findOne({ description: businessFunction });

        if (!entity) {
          console.log(`Entité non trouvée pour la description (businessFunction) : ${businessFunction}`);
          continue; // Passez à la ligne suivante si l'entité n'est pas trouvée
        }

        // ID de l'entité trouvée
        const entityId = entity._id;

        const riskReference = this.generateReference('RSK', riskCount++);
        const controlReference = this.generateReference('CTR', controlCount++);

        // Structurer l'objet de risque
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

        // Structurer l'objet de contrôle
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

        // Initialisez le groupe pour chaque entité si nécessaire
        if (!groupedData[entityId]) {
          groupedData[entityId] = { entity: entityId, risks: [], controls: [] };
        }

        // Ajouter le risque et le contrôle dans les groupes correspondants
        groupedData[entityId].risks.push(risk);
        groupedData[entityId].controls.push(control);
      }

      // Conversion en tableau pour faciliter l'affichage et l'insertion dans MongoDB
      const result = Object.entries(groupedData).map(([entityReference, data]) => ({
        entity: data.entity, // Ajoutez l'ID de l'entité ici
        risks: data.risks,
        controls: data.controls,
      }));

      // Sauvegarder les nouvelles données dans la base de données
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
      // Recherche l'entité en fonction de son nom (description)
      const entity = await Entity.findOne({ description: entityName });

      if (!entity) {
        throw new Error(`Entité non trouvée pour le nom : ${entityName}`);
      }

      // Récupère les EntityRiskControl associés à cette entité
      const data = await EntityRiskControl.find({ entity: entity._id })
        .populate('entity') // Peuple les détails de l'entité
        .exec();

      // Formate les données
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

      return formattedData;
    } catch (error) {
      console.error('Erreur lors de la récupération des données :', error.message);
      throw new Error(`Impossible de récupérer les données pour l'entité : ${entityName}`);
    }
  }

  async getEntityRiskControlById() {
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

  // Copier un risque ou un contrôle vers une autre entité
  async copyRiskOrControl(entityRefId, referenceNumber, type) {
    try {
      const sourceDoc = await EntityRiskControl.findOne({ 'risks.referenceNumber': referenceNumber });
      const destinationDoc = await EntityRiskControl.findOne({ entityRefId });

      if (!sourceDoc || !destinationDoc) {
        throw new Error('Document source ou destination non trouvé');
      }

      let itemToCopy;
      if (type === 'risk') {
        itemToCopy = sourceDoc.risks.find(risk => risk.referenceNumber === referenceNumber);
        if (itemToCopy) {
          itemToCopy.referenceNumber = String(destinationDoc.risks.length + 1).padStart(5, '0');  // Nouvelle référence
          destinationDoc.risks.push(itemToCopy);
        }
      } else if (type === 'control') {
        itemToCopy = sourceDoc.controls.find(control => control.referenceNumber === referenceNumber);
        if (itemToCopy) {
          itemToCopy.referenceNumber = String(destinationDoc.controls.length + 1).padStart(5, '0');  // Nouvelle référence
          destinationDoc.controls.push(itemToCopy);
        }
      }

      await destinationDoc.save();
      return itemToCopy;
    } catch (error) {
      throw new Error('Erreur lors de la copie: ' + error.message);
    }
  }

  // Déplacer un risque ou un contrôle vers une autre entité
  async moveRiskOrControl(entityRefId, referenceNumber, type) {
    try {
      const sourceDoc = await EntityRiskControl.findOne({ 'risks.referenceNumber': referenceNumber });
      const destinationDoc = await EntityRiskControl.findOne({ entityRefId });

      if (!sourceDoc || !destinationDoc) {
        throw new Error('Document source ou destination non trouvé');
      }

      let itemToMove;
      if (type === 'risk') {
        itemToMove = sourceDoc.risks.find(risk => risk.referenceNumber === referenceNumber);
        sourceDoc.risks = sourceDoc.risks.filter(risk => risk.referenceNumber !== referenceNumber);
        if (itemToMove) {
          itemToMove.referenceNumber = String(destinationDoc.risks.length + 1).padStart(5, '0');  // Nouvelle référence
          destinationDoc.risks.push(itemToMove);
        }
      } else if (type === 'control') {
        itemToMove = sourceDoc.controls.find(control => control.referenceNumber === referenceNumber);
        sourceDoc.controls = sourceDoc.controls.filter(control => control.referenceNumber !== referenceNumber);
        if (itemToMove) {
          itemToMove.referenceNumber = String(destinationDoc.controls.length + 1).padStart(5, '0');  // Nouvelle référence
          destinationDoc.controls.push(itemToMove);
        }
      }

      await sourceDoc.save();
      await destinationDoc.save();
      return itemToMove;
    } catch (error) {
      throw new Error('Erreur lors du déplacement: ' + error.message);
    }
  }
}

module.exports = ExcelService;
