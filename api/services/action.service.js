const Action = require("../models/action.model");
const nodemailer = require("nodemailer");

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
      const lastReferenceNumber = parseInt(
        lastAction.reference,
        10
      );
      newReference = String(lastReferenceNumber + 1).padStart(3, "0"); // Conserver le format à 3 chiffres
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

module.exports = {
  getAllAction,
  createAction,
  getAllActionByEntity,
  getAllActionByControl,
};
