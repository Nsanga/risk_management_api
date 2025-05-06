var express = require('express');
var router = express.Router();

// Require controller modules.
const historyController = require('../controllers/history.controller');

const historyRoutes = app => {
  app.use("/history", router);

//Get a list of all predict
router.post('/postHistory', historyController.createHistory);
router.get('/getHistory', historyController.getAllHistory);
}

module.exports = historyRoutes;

