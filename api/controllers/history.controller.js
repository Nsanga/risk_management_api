const History = require("../models/history.model");

const createHistory = async (req, res) => {
  try {
    const newHistory = new History(req.body);
    const savedHistory = await newHistory.save();
    res.json(savedHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createHistory,
};
