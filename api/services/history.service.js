const History = require("../models/history.model");

const generateReference = async () => {
  try {
    const lastHistory = await History.findOne().sort({ createdAt: -1 });
    let newReference = "001";

    if (lastHistory && lastHistory.reference) {
      const lastReference = parseInt(lastHistory.reference, 10);
      newReference = String(lastReference + 1).padStart(3, "0");
    }

    return newReference;
  } catch (error) {
    throw new Error("Erreur lors de la génération de la référence: " + error.message);
  }
};

const createHistory = async (data) => {
  try {
    const reference = await generateReference();
    const newHistory = new History({ ...data, reference });
    return await newHistory.save();
  } catch (error) {
    throw new Error("Erreur lors de la création du test: " + error.message);
  }
};

const getAllHistory = async () => {
  try {
    return await History.find();
  } catch (error) {
    throw new Error("Erreur lors de la récupération de l'historique: " + error.message);
  }
};

module.exports = {
  createHistory,
  getAllHistory,
};
