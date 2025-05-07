const HistoriqueKRI = require("../models/actionKRI.model");
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
    const lastAction = await HistoriqueKRI.findOne().sort({ createdAt: -1 });
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

async function createActionKRI(req, res) {
  try {
    const reference = await generateReference();
    const newAction = new HistoriqueKRI({ ...req.body, reference });
    const savedAction = await newAction.save();

    const emails = [
      req.body.ownerEmail,
      req.body.nomineeEmail,
      req.body.reviewerEmail,
    ];

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails.join(", "),
      subject: `Creation de l'action lié à l'indicateur de risque de reference  KRI${reference}`,
      html: `Une nouvelle action a été créée.<br><br>
        <strong>Détails de l'action:</strong><br>
        Référence: KRI${reference}<br>
        source: ${req.body.source}<br>
        Date: ${req.body.actionState}<br>
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

async function getAllActionByIdKeyIndicator(req, res) {
  try {
    const actions = await HistoriqueKRI.find({
      idKeyIndicator: req.body.idKeyIndicator,
    });
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

async function getAllActionKRI(req, res) {
  try {
    const actions = await HistoriqueKRI.find();
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
  getAllActionByIdKeyIndicator,
  createActionKRI,
  getAllActionKRI,
};
