const HistoriqueKRI = require("../models/actionKRI.model");
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
