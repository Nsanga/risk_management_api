var express = require("express");
var router = express.Router();

const actionController = require("../controllers/action.controller");

const actionRoutes = (app) => {
  app.use("/actions", router);

  router.post("/postAction", actionController.createAction);
  router.post("/getRapport", actionController.getDataRapport);
  router.get("/getAction", actionController.getAllAction);
  router.post("/byEntitity", actionController.getAllActionByEntity);
  router.post("/byControl", actionController.getAllActionByControl);
  router.post("/byReference", actionController.getAllActionByReference);
  //   router.get("/byControl/:id", actionController.getAllActionByControl);
};

module.exports = actionRoutes;
