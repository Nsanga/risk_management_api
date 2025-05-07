var express = require('express');
var router = express.Router();

// Require controller modules.
const riskControlController = require('../controllers/riskControl.controller');

const riskControlRoutes = app => {
  app.use("/risk-controls", router);

//Get a list of all predict
router.post('/create', riskControlController.createRiskControl);
router.put('/update/:id', riskControlController.updateRiskControl);
router.delete('/delete/:id', riskControlController.deleteRiskControl);
router.get('/one/:id', riskControlController.getRiskControlById);
router.get('/all', riskControlController.getAllRiskControls);
}

module.exports = riskControlRoutes;
