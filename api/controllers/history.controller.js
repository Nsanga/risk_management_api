const History = require("../models/history.model");

const createHistory = async (req, res) => {
  try {
    const newHistory = new History(req.body);
    const savedHistory = await newHistory.save();
    res.status(200).json({
      statut: 200,
      message: "Test créé avec succès",
      data: savedHistory,
    });
  } catch (error) {
    res.status(500).json({
      statut: 500,
      message: "Erreur lors de la création du test",
      error: error.message,
    });
  }
};

const getAllHistory = async (req, res) => {
  try {
    const history = await History.find();
    res.status(200).json({
      status: 200,
      message: "Success",
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Erreur lors de la récupération de l'historique",
      error: error.message,
    });
  }
};

module.exports = {
  createHistory,
  getAllHistory,
};
