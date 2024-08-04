var express = require('express');
var router = express.Router();

// Require controller modules.
const entityController = require('../controllers/entity.controller');

const entityRoutes = app => {
  app.use("/entities", router);

//Get a list of all predict
router.post('/create', entityController.createEntity);
router.put('/update/:id', entityController.updateEntity);
router.delete('/delete/:id', entityController.deleteEntity);
router.get('/one/:id', entityController.getEntityById);
router.get('/all', entityController.getAllEntities);
}

module.exports = entityRoutes;
