var express = require('express');
var router = express.Router();

// Require controller modules.
const userGroupController = require('../controllers/userGroup.controller');

const userGroupRoutes = app => {
  app.use("/user-groups", router);

//Get a list of all predict
router.post('/create', userGroupController.createUserGroup);
router.put('/update/:id', userGroupController.updateUserGroup);
router.delete('/delete/:id', userGroupController.deleteUserGroup);
router.get('/one/:id', userGroupController.getUserGroupById);
router.get('/all', userGroupController.getAllUserGroups);
}

module.exports = userGroupRoutes;
