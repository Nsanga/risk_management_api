const express = require("express");
const router = express.Router();
const excelController = require("../controllers/excel.controller");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const excelRoutes = (app) => {
  app.use("/risks-controls", router);

  // Routes pour l'upload et la gestion des entités Risk-Control
  router.post(
    "/upload",
    upload.single("file"),
    excelController.extractDataFromExcel
  );

  router.post("/get-entity", excelController.getEntityRiskControlsByEntityName);

  // Récupérer les données pour une entité spécifique
  router.get("/entity/show", excelController.getEntityRiskControlById);

  router.get("/getKeyIndicator", excelController.getAllKeyIndicators);
  router.post("/get-keyIndicator", excelController.getKeyIndicatorByEntity);

  // Copier un risque ou un contrôle vers une autre entité
  router.post("/copy", excelController.copyRiskOrControls);

  // Déplacer un risque ou un contrôle vers une autre entité
  router.post("/move", excelController.moveRiskOrControls);

  router.put("/update", excelController.updateRiskOrControl);
};

module.exports = excelRoutes;
