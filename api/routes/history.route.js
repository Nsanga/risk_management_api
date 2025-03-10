var express = require("express");
const { createHistory } = require("../controllers/history.controller");
var router = express.Router();
createHistory;

const historyRoutes = (app) => {
  app.use("/history", router);

  router.post("/postHistory", createHistory);
};

module.exports = { historyRoutes };
