const Action = require("../models/action.model");
const nodemailer = require("nodemailer");
const EntityRiskControl = require("../models/entityRiskControl.model");

const transporter = nodemailer.createTransport({
  service: "gmail", // Utilisez le service de messagerie de votre choix
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse email
    pass: process.env.EMAIL_PASS, // Votre mot de passe email ou un mot de passe d'application
  },
});

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
    if (!sesion || !targetEntityId || !type) {
      throw new Error(
        "Les paramètres 'sesion', 'targetEntityId' et 'type' sont requis."
      );
    }

    let filteredControls = [];

    for (const itemId of targetEntityId) {
      const entityData = await EntityRiskControl.findOne({ entity: itemId });

      if (entityData && entityData.controls && entityData.risks) {
        const controlsMatched = entityData.controls
          .map((control, index) => {
            // if (control.frequence === sesion) {
            const correspondingRisk = entityData.risks[index];
            return {
              ...(control.toObject?.() ?? control),
              referenceRisk: correspondingRisk?.reference || null,
              descriptionRisk: correspondingRisk?.description || null,
            };
            // }
            // return null;
          })
          .filter(Boolean);

        filteredControls.push(...controlsMatched);
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
