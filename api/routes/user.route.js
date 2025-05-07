const express = require('express');
const router = express.Router();
const userHandler = require('../controllers/user.controller');

/**
 * Set up the user routes and link them to the corresponding controller functions.
 * @param {express.Application} app - The Express application.
 */
const setupUserRoutes = (app) => {
<<<<<<< HEAD
    // Mount the 'router' to handle routes with the base path '/user'.
    app.use("/user", router);

    router.get('/list', (req, res) => {
        userHandler.getAllUser(req, res);

    router.post('/login', (req, res) => {
        userHandler.login(req, res);
    });

    router.post('/signup', (req, res) => {
        userHandler.signUp(req, res);
    });

    router.put('/update', (req, res) => {
        userHandler.updateUser(req, res);
    });
};

module.exports = { setupUserRoutes };
=======
  // Mount the 'router' to handle routes with the base path '/user'.
  app.use("/user", router);

  router.get("/list", (req, res) => {
    userHandler.getAllUser(req, res);
