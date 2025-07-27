const XLSX = require("xlsx");
const Entity = require("../models/entity.model");
const EntityRiskControl = require("../models/entityRiskControl.model");
const historyModel = require("../models/history.model");
const KeyIndicator = require("../models/keyIndicator.model");

const mongoose = require("mongoose");

class ExcelService {
  constructor(file, tenantId) {
    this.file = file; // Assurez-vous que le fichier est passé ici
    this.tenantId = tenantId;
  }

  generateReference(prefix, count) {
    return `${prefix}${String(count).padStart(4, "0")}`;
  }

  generateReferenceIndicator(count) {
    return `${String(count).padStart(4, "0")}`;
  }

  generateRandomReference(prefix, timestamp) {
    // Convertit le timestamp en un format unique mais limité à 5 chiffres
    const randomPart = String(timestamp).slice(-5); // Prend les 5 derniers chiffres du timestamp
    return `${prefix}${randomPart}`;
  }

  async readExcelFile() {
    try {
      const workbook = XLSX.read(this.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

      await EntityRiskControl.deleteMany({ tenantId: this.tenantId });
      // console.log("Anciennes données supprimées avec succès.");

      const riskTableStartIndex =
        data.findIndex((row) => row[0] === "TOP Risks") + 2;
      const riskTableEndIndex = data.findIndex(
        (row, index) => index > riskTableStartIndex && row.length === 0
      );
      const riskData = data.slice(
        riskTableStartIndex,
        riskTableEndIndex > 0 ? riskTableEndIndex : undefined
      );

      const groupedData = {};
      const groupedKeyIndicator = {};
      let riskCount = 1;
      let controlCount = 1;
      let riskCountKeyIndicator = 1;

      for (const row of riskData) {
        const businessFunction = row[2];

        const entity = await Entity.findOne({ description: businessFunction, tenantId: this.tenantId, });
        if (!entity) {
          console.log(
            `Entité non trouvée pour la description : ${businessFunction}`
          );
          continue;
        }

        const entityId = entity._id;

        const riskReference = this.generateReference("RSK", riskCount++);
        const controlReference = this.generateReference("CTR", controlCount++);
        const riskReferenceKeyIndicator = this.generateReferenceIndicator(
          riskCountKeyIndicator++
        );

        const risk = {
          reference: riskReference,
          serialNumber: row[0],
          entityReference: entityId,
          departmentFunction: row[2],
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
          riskLevel: row[13],
          evaluationDate: row[22] || '1/1/2025',
          riskIndicatorDescription: row[23],
          riskMesure: row[24],
          frequenceCaptureRisk: row[25],
          calculMethodRisk: row[26],
          riskTolerence: row[27],
          riskSeuil: row[28],
          riskEscalade: row[29],
          ownerRisk: "Database administrator",
          nomineeRisk: "Database administrator",
          reviewerRisk: "Database administrator",
        };

        const control = {
          reference: controlReference,
          controlSummary: row[14],
          controlDescription: row[15],
          monitoringMethodology: row[16],
          controlRating: row[17],
          residualRiskLevel: row[18],
          preventiveDetectiveControl: row[19],
          monitoringCycle: row[20],
          documentSources: row[21],
          frequence: row[25],
          // monitoringCycle: row[21],
          // documentSources: row[22],
          // status: row[29],

          // library: row[28],
          ownerControl: "Database administrator",
          nomineeControl: "Database administrator",
          reviewerControl: "Database administrator",
        };

        const dataKeyIndicator = {
          reference: riskReferenceKeyIndicator,
          entityReference: entityId,
          departmentFunction: row[2],
          riskIndicatorDescription: row[23],
          mesureKeyIndicator: row[24],
          frequenceKeyIndicator: row[25],
          calculMethodKeyIndicator: row[26],
          toleranceKeyIndicator: row[27],
          seuilKeyIndicator: row[28],
          escaladeKeyIndicator: row[29],
          treshold: row[30] || "Target - higher value is worse",
          ownerKeyIndicator: "Database administrator",
          nomineeKeyIndicator: "Database administrator",
          reviewerKeyIndicator: "Database administrator",
        };

        if (!groupedData[entityId]) {
          groupedData[entityId] = { entity, risks: [], controls: [] };
        }

        groupedData[entityId].risks.push(risk);
        groupedData[entityId].controls.push(control);

        if (!groupedKeyIndicator[entityId]) {
          groupedKeyIndicator[entityId] = { entity, dataKeyIndicators: [] };
        }

        groupedKeyIndicator[entityId].dataKeyIndicators.push(dataKeyIndicator);
      }

      const result = Object.values(groupedData).map(
        ({ entity, risks, controls }) => ({
          entity: new mongoose.Types.ObjectId(entity._id), // Convertissez en ObjectId ici
          tenantId: this.tenantId,
          risks,
          controls,
        })
      );
      // console.log("Données sauvegardées dans la base de données avec succès.", result.risks);
      await EntityRiskControl.insertMany(result);

      const resultKeyIndicator = Object.values(groupedKeyIndicator).map(
        ({ entity, dataKeyIndicators }) => ({
          entity: new mongoose.Types.ObjectId(entity._id),
          tenantId: this.tenantId,
          dataKeyIndicators,
        })
      );

      await KeyIndicator.insertMany(resultKeyIndicator);

      console.log("Données sauvegardées dans la base de données avec succès.");
      return { result, resultKeyIndicator };
    } catch (error) {
      console.error(
        "Erreur lors de la lecture du fichier Excel :",
        error.message
      );
      return null;
    }
  }

  async getEntityRiskControlsByEntityName(entityName, tenantId) {
    try {
      // Récupère l'entité par son nom
      const entity = await Entity.findOne({ description: entityName, tenantId });

      if (!entity) {
        throw new Error(`Entité '${entityName}' introuvable`);
      }

      // Récupère les risques et contrôles associés à cette entité
      const data = await EntityRiskControl.find({ entity: entity._id, tenantId })
        .populate("entity") // Peupler les détails de l'entité
        .exec();

      // Pour chaque document, enrichir les contrôles avec les historiques
      const formattedData = await Promise.all(
        data.map(async (doc) => {
          const enrichedControls = await Promise.all(
            doc.controls.map(async (control) => {
              const historyControl = await historyModel.find({
                idControl: control._id,
              });
              return {
                ...control.toObject(),
                historyControl,
              };
            })
          );

          return {
            entity: {
              referenceId: doc.entity.referenceId,
              description: doc.entity.description,
              ram: doc.entity.ram,
              location: doc.entity.location,
              businessLine: doc.entity.businessLine,
            },
            risks: doc.risks,
            controls: enrichedControls,
          };
        })
      );

      return formattedData;
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error.message);
      throw new Error("Impossible de récupérer les données pour l'entité.");
    }
  }

  async getSpecificRiskOrControl({ idRisk, idControl, tenantId }) {
    try {
      const allEntities = await EntityRiskControl.find({ tenantId })
        .populate("entity")
        .exec();

      for (const entityDoc of allEntities) {
        if (idRisk) {
          const foundRisk = entityDoc.risks.find(
            (risk) => risk._id.toString() === idRisk
          );

          if (foundRisk) {
            return {
              type: "risk",
              entity: {
                referenceId: entityDoc.entity.referenceId,
                description: entityDoc.entity.description,
                ram: entityDoc.entity.ram,
                location: entityDoc.entity.location,
                businessLine: entityDoc.entity.businessLine,
              },
              data: foundRisk,
            };
          }
        }

        if (idControl) {
          const foundControl = entityDoc.controls.find(
            (control) => control._id.toString() === idControl
          );

          if (foundControl) {
            const historyControl = await historyModel.find({
              idControl: foundControl._id,
            });

            return {
              type: "control",
              entity: {
                referenceId: entityDoc.entity.referenceId,
                description: entityDoc.entity.description,
                ram: entityDoc.entity.ram,
                location: entityDoc.entity.location,
                businessLine: entityDoc.entity.businessLine,
              },
              data: {
                ...foundControl.toObject(),
                historyControl,
              },
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error("Erreur dans getSpecificRiskOrControl:", error.message);
      throw new Error("Impossible de récupérer le risque ou le contrôle.");
    }
  }

  getNextReference(array, reference, key) {
    const extractNumber = (ref) => parseInt(ref.replace(/[^\d]/g, ""));

    // Trouver l'élément avec la plus grande référence supérieure à la référence donnée
    const maxReference = array
      .flatMap((item) => item[key])
      .filter(
        (item) => extractNumber(item.reference) > extractNumber(reference)
      )
      .reduce(
        (max, current) => {
          return extractNumber(current.reference) > extractNumber(max.reference)
            ? current
            : max;
        },
        { reference }
      );

    // Extraire la partie numérique de la plus grande référence et l'incrémenter de 1
    const maxNumber = extractNumber(maxReference.reference);
    const nextNumber = maxNumber + 1;

    return nextNumber;
  }

  async copyRiskOrControls(itemIds, targetEntityId, type = "risk", tenantId) {
    try {
      let items = await EntityRiskControl.find({ tenantId });
      const totalRisks = items.reduce(
        (sum, item) => sum + item.risks.length,
        0
      );
      const totalControls = items.reduce(
        (sum, item) => sum + item.controls.length,
        0
      );

      let riskCounter = totalRisks;
      let controlCounter = totalControls;

      const targetEntity = await Entity.findById(targetEntityId, tenantId);
      if (!targetEntity) {
        throw new Error("Entité cible introuvable.");
      }

      let targetEntityRiskControl = await EntityRiskControl.findOne({
        entity: targetEntityId,
        tenantId
      });
      if (!targetEntityRiskControl) {
        targetEntityRiskControl = new EntityRiskControl({
          tenantId,
          entity: targetEntityId,
          risks: [],
          controls: [],
        });
      }

      targetEntityRiskControl.controls = targetEntityRiskControl.controls || [];
      targetEntityRiskControl.risks = targetEntityRiskControl.risks || [];

      let copiedCount = 0;
      let iterationCount = 0;
      let refNumber = 0;

      for (const itemId of itemIds) {
        iterationCount++;
        const item = await EntityRiskControl.findOne({
          [`${type}s._id`]: itemId,
          tenantId
        });
        if (!item) continue;

        const itemToCopy = item[`${type}s`].id(itemId);

        if (!itemToCopy) continue;

        const alreadyExists = targetEntityRiskControl[`${type}s`].some(
          (existingItem) =>
            existingItem[
            `${type === "risk" ? "description" : "controlDescription"}`
            ] ===
            itemToCopy[
            `${type === "risk" ? "description" : "controlDescription"}`
            ]
        );

        if (alreadyExists) {
          return { success: false, message: "Élément déjà existant", data: {} };
        }

        // const newReference =
        //   type === "risk"
        //     ? `RSK${String(++riskCounter).padStart(5, "0")}`
        //     : `CTR${String(++controlCounter).padStart(5, "0")}`;

        refNumber =
          iterationCount > 1
            ? ++refNumber
            : this.getNextReference(
              items,
              itemToCopy.reference.toString(),
              type === "risk" ? "risks" : "controls"
            );

        const codeRef = refNumber.toString().padStart(4, "0");

        const newReference =
          type === "risk" ? `RSK${codeRef}` : `CTR${codeRef}`;

        if (!newReference)
          throw new Error("La référence générée est invalide.");

        const copiedItem =
          type === "risk"
            ? {
              ...itemToCopy.toObject(),
              reference: newReference,
              // businessFunction: targetEntity.description,
              departmentFunction: targetEntity.description,
              reference: `RSK${codeRef}`,
              ownerRisk: "Database administrator",
              nomineeRisk: "Database administrator",
              reviewerRisk: "Database administrator",
              _id: new mongoose.Types.ObjectId(),
            }
            : {
              ...itemToCopy.toObject(),
              reference: newReference,
              // businessFunction: targetEntity.description,
              departmentFunction: targetEntity.description,
              ownerControl: "Database administrator",
              nomineeControl: "Database administrator",
              reviewerControl: "Database administrator",
              _id: new mongoose.Types.ObjectId(),
            };

        targetEntityRiskControl[`${type}s`].push(copiedItem);
        copiedCount++;

        const relatedIndex = item[`${type}s`].findIndex(
          (current) => current._id.toString() === itemToCopy._id.toString()
        );

        if (
          type === "risk" &&
          relatedIndex >= 0 &&
          relatedIndex < item.controls.length
        ) {
          const controlToCopy = item.controls[relatedIndex];
          if (controlToCopy) {
            const controlAlreadyExists = targetEntityRiskControl.controls.some(
              (existingControl) =>
                existingControl.controlDescription ===
                controlToCopy.controlDescription
            );

            if (!controlAlreadyExists) {
              const copiedControl = {
                ...controlToCopy.toObject(),
                reference: `CTR${codeRef}`,
                ownerControl: "Database administrator",
                nomineeControl: "Database administrator",
                reviewerControl: "Database administrator",
                // reference: this.generateRandomReference("CTR", Date.now()),
                businessFunction: targetEntity.description,
                _id: new mongoose.Types.ObjectId(),
              };
              targetEntityRiskControl.controls.push(copiedControl);
            }
          }
        } else if (
          type === "control" &&
          relatedIndex >= 0 &&
          relatedIndex < item.risks.length
        ) {
          const riskToCopy = item.risks[relatedIndex];
          if (riskToCopy) {
            const riskAlreadyExists = targetEntityRiskControl.risks.some(
              (existingRisk) =>
                existingRisk.riskDescription === riskToCopy.riskDescription
            );

            if (!riskAlreadyExists) {
              const copiedRisk = {
                ...riskToCopy.toObject(),
                reference: `RSK${codeRef}`,
                ownerRisk: "Database administrator",
                nomineeRisk: "Database administrator",
                reviewerRisk: "Database administrator",
                departmentFunction: targetEntity.description,
                // reference: this.generateRandomReference("RSK", Date.now()),
                businessFunction: targetEntity.description,
                _id: new mongoose.Types.ObjectId(),
              };
              targetEntityRiskControl.risks.push(copiedRisk);
            }
          }
        }
      }

      if (copiedCount > 0) await targetEntityRiskControl.save();

      return {
        success: true,
        message: `Tous les ${type === "risk" ? "risques" : "contrôles"
          } valides ont été copiés.`,
        data: targetEntityRiskControl,
      };
    } catch (error) {
      return {
        success: false,
        message: "Erreur lors de la copie.",
        error: error.message,
      };
    }
  }

  async moveRiskOrControls(itemIds, targetEntityId, type = "risk", tenantId) {
    try {
      let items = await EntityRiskControl.find({ tenantId });

      const totalRisks = items.reduce(
        (sum, item) => sum + item.risks.length,
        0
      );
      const totalControls = items.reduce(
        (sum, item) => sum + item.controls.length,
        0
      );

      let riskCounter = totalRisks;
      let controlCounter = totalControls;
      const targetEntity = await Entity.findById(targetEntityId, tenantId);
      if (!targetEntity) {
        throw new Error("Entité cible introuvable.");
      }

      let targetEntityRiskControl = await EntityRiskControl.findOne({
        entity: targetEntityId,
        tenantId
      });
      if (!targetEntityRiskControl) {
        targetEntityRiskControl = new EntityRiskControl({
          tenantId,
          entity: targetEntityId,
          risks: [],
          controls: [],
        });
      }

      if (!Array.isArray(targetEntityRiskControl.controls)) {
        targetEntityRiskControl.controls = [];
      }
      if (!Array.isArray(targetEntityRiskControl.risks)) {
        targetEntityRiskControl.risks = [];
      }

      let movedCount = 0;
      let iterationCount = 0;
      let refNumber = 0;
      const errorItems = [];

      for (const itemId of itemIds) {
        try {
          const item = await EntityRiskControl.findOne({
            [`${type}s._id`]: itemId,
            tenantId
          });

          if (!item) {
            console.error(
              `${type === "risk" ? "Risque" : "Contrôle"
              } introuvable pour l'ID ${itemId}.`
            );
            errorItems.push(itemId);
            continue;
          }

          const itemToMove = item[`${type}s`].id(itemId);
          if (!itemToMove) {
            console.error(
              `Élément ${type === "risk" ? "risque" : "contrôle"
              } non trouvé pour l'ID ${itemId}.`
            );
            errorItems.push(itemId);
            continue;
          }

          const alreadyExists = targetEntityRiskControl[`${type}s`].some(
            (existingItem) => existingItem.reference === itemToMove.reference
          );
          if (alreadyExists) {
            console.log(
              `${type === "risk" ? "Risque" : "Contrôle"
              } déjà existant dans l'entité cible.`
            );
            errorItems.push(itemId);
            continue;
          }

          const newReference =
            type === "risk"
              ? `RSK${String(++riskCounter).padStart(5, "0")}`
              : `CTR${String(++controlCounter).padStart(5, "0")}`;

          if (!newReference)
            throw new Error("La référence générée est invalide.");

          const isRisk = type === "risk";
          const isTrash = targetEntity.description === "Corbeille ";

          const movedItem = {
            ...itemToMove.toObject(),
            departmentFunction: targetEntity.description,
            _id: new mongoose.Types.ObjectId(),
            ...(isTrash
              ? {}
              : {
                // reference: `RSK${codeRef}`,
                reference: newReference,
                ...(isRisk
                  ? {
                    ownerRisk: "Database administrator",
                    nomineeRisk: "Database administrator",
                    reviewerRisk: "Database administrator",
                  }
                  : {
                    ownerControl: "Database administrator",
                    nomineeControl: "Database administrator",
                    reviewerControl: "Database administrator",
                  }),
              }),
          };

          // const movedItem =
          // targetEntity.description === "Corbeille "
          //   ? {
          //       ...itemToMove.toObject(),
          //       departmentFunction: targetEntity.description,
          //       _id: new mongoose.Types.ObjectId(),
          //     }
          //   : {
          //       ...itemToMove.toObject(),
          //       reference: newReference,
          //       departmentFunction: targetEntity.description,
          //       _id: new mongoose.Types.ObjectId(),
          //     };

          targetEntityRiskControl[`${type}s`].push(movedItem);
          movedCount++;

          const indexToRemove = item[`${type}s`].findIndex(
            (el) => el._id.toString() === itemId.toString()
          );

          if (
            type === "risk" &&
            indexToRemove >= 0 &&
            item.controls.length > indexToRemove
          ) {
            const controlToMove = item.controls[indexToRemove];

            const movedControl =
              targetEntity.description === "Corbeille "
                ? {
                  ...controlToMove.toObject(),
                  ownerControl: "Database administrator",
                  nomineeControl: "Database administrator",
                  reviewerControl: "Database administrator",
                  businessFunction: targetEntity.description,
                  _id: new mongoose.Types.ObjectId(),
                }
                : {
                  ...controlToMove.toObject(),
                  ownerControl: "Database administrator",
                  nomineeControl: "Database administrator",
                  reviewerControl: "Database administrator",
                  businessFunction: targetEntity.description,
                  reference: `CTR${String(++controlCounter).padStart(
                    5,
                    "0"
                  )}`,
                  // reference: this.generateRandomReference("CTR", Date.now()),
                  _id: new mongoose.Types.ObjectId(),
                };

            const controlExists = targetEntityRiskControl.controls.some(
              (existingControl) =>
                existingControl.reference === controlToMove.reference
            );
            if (!controlExists) {
              targetEntityRiskControl.controls.push(movedControl);
            }

            item.controls.splice(indexToRemove, 1);
          } else if (
            type === "control" &&
            indexToRemove >= 0 &&
            item.risks.length > indexToRemove
          ) {
            const riskToMove = item.risks[indexToRemove];
            const movedRisk =
              targetEntity.description === "Corbeille "
                ? {
                  ...riskToMove.toObject(),
                  departmentFunction: targetEntity.description,
                  ownerRisk: "Database administrator",
                  nomineeRisk: "Database administrator",
                  reviewerRisk: "Database administrator",
                  _id: new mongoose.Types.ObjectId(),
                }
                : {
                  ...riskToMove.toObject(),
                  reference: `RSK${String(++riskCounter).padStart(5, "0")}`,
                  ownerRisk: "Database administrator",
                  nomineeRisk: "Database administrator",
                  reviewerRisk: "Database administrator",
                  departmentFunction: targetEntity.description,
                  // reference: this.generateRandomReference("CTR", Date.now()),
                  _id: new mongoose.Types.ObjectId(),
                };

            const riskExists = targetEntityRiskControl.risks.some(
              (existingRisk) =>
                existingRisk.riskDescription === riskToMove.riskDescription
            );
            if (!riskExists) {
              targetEntityRiskControl.risks.push(movedRisk);
            }

            item.risks.splice(indexToRemove, 1);
          }

          item[`${type}s`].splice(indexToRemove, 1);
          await item.save();
        } catch (err) {
          console.error("Erreur lors du traitement de l'élément :", err);
          errorItems.push(itemId);
        }
      }

      if (movedCount > 0) {
        console.log(`${movedCount} éléments ont été déplacés.`);
        await targetEntityRiskControl.save();
      } else {
        console.log("Aucun élément n'a été déplacé.");
      }

      return {
        success: true,
        message: `Tous les ${type === "risk" ? "risques" : "contrôles"
          } ont été déplacés avec succès.`,
        data: targetEntityRiskControl,
        errorItems,
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

  async getAllKeyIndicators({ tenantId }) {
    try {
      const keyIndicators = await KeyIndicator.find({ tenantId });
      return keyIndicators;
    } catch (error) {
      console.error("Erreur lors de la récupération des indicateurs clés :", error);
      throw new Error("Impossible de récupérer les indicateurs clés.");
    }
  }

  async getKeyIndicatorByEntity({ entityId, tenantId }) {
    try {
      const entity = await KeyIndicator.findOne({
        entity: entityId,
        tenantId
      });
  
      if (!entity) {
        throw new Error(`Entité '${entityId}' introuvable`);
      }
  
      return entity;
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error.message);
      throw new Error("Impossible de récupérer les données pour l'entité.");
    }
  }  
}

module.exports = ExcelService;