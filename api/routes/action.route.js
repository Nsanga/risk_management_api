var express = require("express");
var router = express.Router();

const actionController = require("../controllers/action.controller");

const actionRoutes = (app) => {
  app.use("/actions", router);

  router.post("/postAction", actionController.createAction);
  router.get("/getAction", actionController.getAllAction);
  router.get("/byEntity", actionController.getAllActionByEntity);
  router.get("/byControl", actionController.getAllActionByControl);
//   router.get("/byControl/:id", actionController.getAllActionByControl);
};

module.exports = actionRoutes;
