var express = require('express');
var router = express.Router();
const multer = require('multer');

// Require controller modules.
const entityRiskControlController = require('../controllers/entityRiskControl.controller');

const entityRiskControlRoutes = app => {
  app.use("/risk-control", router);

//Get a list of all predict
router.post('/create', entityRiskControlController.createEntityRiskControl);
router.put('/update/:id', entityRiskControlController.updateEntityRiskControl);
router.delete('/delete/:id', entityRiskControlController.deleteEntityRiskControl);
router.get('/one/:id', entityRiskControlController.getEntityRiskControlById);
router.get('/all', entityRiskControlController.getAllEntityRiskControls);
}

module.exports = entityRiskControlRoutes;
