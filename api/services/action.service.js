const Action = require("../models/action.model");
const nodemailer = require("nodemailer");
const EntityRiskControl = require("../models/entityRiskControl.model");
const keyIndicatorSchema = require("../models/keyIndicator.model");
const historyKRIModel = require("../models/historyKRI.model");
const actionKRIModel = require("../models/actionKRI.model");
const historySchema = require("../models/history.model");
const actionSchema = require("../models/action.model");

const transporter = nodemailer.createTransport({
  service: "gmail", // Utilisez le service de messagerie de votre choix
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse email
    pass: process.env.EMAIL_PASS, // Votre mot de passe email ou un mot de passe d'application
  },
});

const compareWithThreshold = (val, threshold) => {
  if (!threshold || val == null) return false;
  const numVal = Number(val);
  if (Number.isNaN(numVal)) return false;

  // ----- Intervalle combiné
  if (/<=?[0-9.]+>?[0-9.]+/.test(threshold)) {
    const [upperStr, lowerStr] = threshold.split(/>|</).filter(Boolean);
    const upper = Number(upperStr.replace("=", ""));
    const lower = Number(lowerStr);
    const upperOK = threshold.includes("<=") ? numVal <= upper : numVal < upper;
    const lowerOK = threshold.includes(">") ? numVal > lower : numVal >= lower;
    return upperOK && lowerOK;
  }

  // ----- Opérateurs simples
  if (threshold.startsWith(">=")) return numVal >= Number(threshold.slice(2));
  if (threshold.startsWith("<=")) return numVal <= Number(threshold.slice(2));
  if (threshold.startsWith(">")) return numVal > Number(threshold.slice(1));
  if (threshold.startsWith("<")) return numVal < Number(threshold.slice(1));

  // ----- Valeur exacte
  return numVal === Number(threshold);
};

/** Renvoie {"Escalade"|"Alerte"|"Tolérance"|"OK"|"N/A"} + couleur Chakra UI */
const getKriStatus = (moyenne, tol, seuil, escal) => {
  if (moyenne == null) return { kriStatus: "N/A", kriColor: "gray.600" };
  if (compareWithThreshold(moyenne, escal))
    return { kriStatus: "Critique", kriColor: "red.400" };
  if (compareWithThreshold(moyenne, seuil))
    return { kriStatus: "Intermediare", kriColor: "orange.300" };
  if (compareWithThreshold(moyenne, tol))
    return { kriStatus: "Stable", kriColor: "green.400" };
  return { kriStatus: "OK", kriColor: "green.500" };
};

async function generateReference() {
  try {
    const lastAction = await Action.findOne().sort({ createdAt: -1 });
    let newReference = "001";

    if (lastAction && lastAction.reference) {
      const lastReference = parseInt(lastAction.reference, 10);
      newReference = String(lastReference + 1).padStart(3, "0");
    }

    return newReference;
  } catch (error) {
    throw new Error(
      "Erreur lors de la génération de la référence: " + error.message
    );
  }
}

async function createAction(req, res) {
  try {
    const reference = await generateReference();
    const newAction = new Action({ ...req.body, reference });
    const savedAction = await newAction.save();

    if (req.body.emailProprio) {
      const emails = req.body.emailProprio;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails,
        subject: "Notification de Création d'Action",
        html: `Vous avez été assigné à l'action : <br><br>
            <strong>Détails de l'action:</strong><br>
            Référence: ACT${reference}<br>
            <br>
            <a href="https://futuriskmanagement.com" target="_blank">Cliquer ici pour vous connecter</a>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error("Error sending email:", error);
        } else {
          logger.info("Email sent:", info.response);
        }
      });
    }
    res.status(200).json({
      statut: 200,
      message: "Action créé avec succès",
      data: savedAction,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Erreur lors de la création du test: " + error.message });
  }
}

async function getAllActionByEntity(req, res) {
  try {
    const actions = await Action.find({ idEntity: req.body.idEntity });
    // res.status(200).json(actions);
    res.status(200).json({
      statut: 200,
      message: "Action liée à l'entité",
      data: actions,
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération de l'historique: " + error.message,
    });
  }
}

async function getAllActionByControl(req, res) {
  try {
    const actions = await Action.find({ idControl: req.body.idControl });
    // res.status(200).json(actions);
    res.status(200).json({
      statut: 200,
      message: "Action liée au control",
      data: actions,
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération de l'historique: " + error.message,
    });
  }
}

async function getAllActionByReference(req, res) {
  try {
    const actions = await Action.find({
      reference: req.body.reference,
    });
    // res.status(200).json(actions);
    res.status(200).json({
      statut: 200,
      message: "Action liée à la référence",
      data: actions,
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération de l'historique: " + error.message,
    });
  }
}

async function getAllAction(req, res) {
  try {
    const actions = await Action.find();
    res.status(200).json({
      statut: 200,
      message: "Action reucpérée avec succès",
      data: actions,
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération de l'historique: " + error.message,
    });
  }
}

async function getDataRapport(req, res) {
  const { sesion, targetEntityId, type } = req.body;
  try {
    // if (!sesion || !targetEntityId || !type) {
    //   throw new Error(
    //     "Les paramètres 'sesion', 'targetEntityId' et 'type' sont requis."
    //   );
    // }

    let filteredControls = [];

    if (type === "riskControl") {
      for (const itemId of targetEntityId) {
        const entityData = await EntityRiskControl.findOne({
          entity: itemId,
        }).populate("entity");

        if (entityData && entityData.controls && entityData.risks) {
          const indicatorIds = entityData.controls.map((item) => item._id);

          const histories = await historySchema.find({
            idControl: { $in: indicatorIds },
          });

          const actions = await actionSchema.find({
            idControl: { $in: indicatorIds },
          });

          const historyMap = histories.reduce((acc, hist) => {
            const key = hist.idControl.toString();
            if (!acc[key]) acc[key] = [];
            acc[key] = acc[key] || [];
            acc[key].push(hist);
            return acc;
          }, {});

          const actionsMap = actions.reduce((acc, hist) => {
            const key = hist.idControl.toString();
            if (!acc[key]) acc[key] = [];
            acc[key] = acc[key] || [];
            acc[key].push(hist);
            return acc;
          }, {});

          const controlsMatched = entityData.controls
            .map((control, index) => {
              // if (control.frequence === sesion) {
              const correspondingRisk = entityData.risks[index];

              return {
                ...(control.toObject?.() ?? control),
                referenceRisk: correspondingRisk?.reference || null,
                entitie: entityData.entity,
                riskAssociate: correspondingRisk || null,
                history: historyMap[control._id.toString()] || [],
                actions: actionsMap[control._id.toString()] || [],
              };
              // }
              // return null;
            })
            .filter(Boolean);

          filteredControls.push(...controlsMatched);
        }
      }
    } else {
      for (const itemId of targetEntityId) {
        const entityData = await keyIndicatorSchema
          .findOne({ entity: itemId })
          .populate("entity");

        if (entityData && Array.isArray(entityData.dataKeyIndicators)) {
          // 1. Tous les IDs d’indicateurs
          const indicatorIds = entityData.dataKeyIndicators.map(
            (item) => item._id
          );

          // 2. Historiques et actions
          const histories = await historyKRIModel.find({
            idKeyIndicator: { $in: indicatorIds },
          });

          const actions = await actionKRIModel.find({
            idKeyIndicator: { $in: indicatorIds },
          });

          // 3. Grouper par indicateur
          const historyMap = histories.reduce((acc, hist) => {
            const key = hist.idKeyIndicator.toString();
            (acc[key] ||= []).push(hist);
            return acc;
          }, {});

          const actionMap = actions.reduce((acc, act) => {
            const key = act.idKeyIndicator.toString();
            (acc[key] ||= []).push(act);
            return acc;
          }, {});

          // 4. Construire les indicateurs enrichis avec la moyenne
          const enrichedIndicators = entityData.dataKeyIndicators.map(
            (indicator) => {
              const idStr = indicator._id.toString();
              const histList = historyMap[idStr] || [];

              // calcul de la moyenne des champs `value`
              const moyenneValue =
                histList.length > 0
                  ? histList.reduce((sum, h) => sum + Number(h.value || 0), 0) /
                    3
                  : null; // ou 0 si tu préfères

              const { kriStatus, kriColor } = getKriStatus(
                moyenneValue,
                indicator.toleranceKeyIndicator,
                indicator.seuilKeyIndicator,
                indicator.escaladeKeyIndicator
              );
              return {
                ...(indicator.toObject?.() ?? indicator),
                entitie: entityData.entity,
                history: histList,
                actions: actionMap[idStr] || [],
                moyenneValue, // <- champ ajouté
                kriStatus,
              };
            }
          );

          filteredControls.push(...enrichedIndicators);
        }
      }
    }

    return res.json({
      success: true,
      message: `Tous les contrôles avec frequence = '${sesion}' ont été récupérés avec succès.`,
      data: filteredControls,
      total: filteredControls.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération :", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des éléments.",
      error: error.message,
    });
  }
}

module.exports = {
  getAllAction,
  createAction,
  getAllActionByEntity,
  getAllActionByControl,
  getAllActionByReference,
  getDataRapport,
};
