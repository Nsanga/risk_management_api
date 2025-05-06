var express = require('express');
var router = express.Router();

// Require controller modules.
const profileController = require('../controllers/userProfile.controller');

const profileRoutes = app => {
  app.use("/profiles", router);

//Get a list of all predict
router.post('/create', profileController.createProfile);
router.put('/update/:id', profileController.updateProfile);
router.delete('/delete/:id', profileController.deleteProfile);
router.get('/one/:id', profileController.getProfileById);
router.get('/all', profileController.getAllProfiles);
}

module.exports = profileRoutes;
