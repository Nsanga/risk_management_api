var express = require("express");
const {
  createHistory,
  getAllHistory,
} = require("../controllers/history.controller");
var router = express.Router();
createHistory;

const historyRoutes = (app) => {
  app.use("/history", router);

  router.post("/postHistory", createHistory);
  router.get("/getHistory", getAllHistory);
};

module.exports = { historyRoutes };
