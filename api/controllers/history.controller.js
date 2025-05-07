const historyService = require("../services/history.service");

const createHistory = async (req, res) => {
  try {
    const savedHistory = await historyService.createHistory(req.body);
    res.status(200).json({
      statut: 200,
      message: "Test créé avec succès",
      data: savedHistory,
    });
  } catch (error) {
    res.status(500).json({
      statut: 500,
      message: error.message,
    });
  }
};

const getAllHistory = async (req, res) => {
  try {
    const history = await historyService.getAllHistory();
    res.status(200).json({
      status: 200,
      message: "Success",
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

module.exports = {
  createHistory,
  getAllHistory,
};
