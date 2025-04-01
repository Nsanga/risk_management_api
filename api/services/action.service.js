const Action = require("../models/action.model");

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
