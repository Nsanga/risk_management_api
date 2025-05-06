var express = require("express");
var router = express.Router();

const historiqueKRIController = require("../controllers/historyKRI.controller");

const historyKRIRoutes = (app) => {
  app.use("/historiqueKRI", router);

  router.post("/postHistoriqueKRI", historiqueKRIController.createHistoryKRI);
  router.get("/getHistoriqueKRI", historiqueKRIController.getAllHistoriqueKri);
  router.post(
    "/getHistoriqueKRIByIdKeyIndicator",
    historiqueKRIController.getAllHistoriqueByIdKeyIndicator
  );
};

module.exports = historyKRIRoutes;