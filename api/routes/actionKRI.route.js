var express = require("express");
var router = express.Router();

const actionKRIController = require("../controllers/actionKRI.controller");

const actionKRIRoutes = (app) => {
  app.use("/actionKRI", router);

  router.post("/postActionKRI", actionKRIController.createActionKRI);
  router.get("/getActionKRI", actionKRIController.getAllActionKRI);
  router.post(
    "/getActionByIdKeyIndicator",
    actionKRIController.getAllActionByIdKeyIndicator
  );

  router.put("/updateActionKRI/:id", actionKRIController.updateActionKRI);
};

module.exports = actionKRIRoutes;
