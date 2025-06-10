var express = require('express');
var router = express.Router();

// Require controller modules.
const statsController = require('../controllers/stats.controller');

const statsRoute = app => {
  app.use("/stats", router);

//Get a list of all predict
router.get('/get-stats', statsController.getStats);
}

module.exports = statsRoute;
