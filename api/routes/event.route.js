var express = require('express');
var router = express.Router();
const multer = require('multer');
const upload = multer();

// Require controller modules.
const eventController = require('../controllers/event.controller');

const eventRoutes = app => {
  app.use("/events", router);

//Get a list of all predict
router.post('/create', upload.array('document'), eventController.createEvent);
router.put('/update/:id', eventController.updateEvent);
router.delete('/delete/:id', eventController.deleteEvent);
router.get('/one/:id', eventController.getEventById);
router.get('/all', eventController.getAllEvents);
}

module.exports = eventRoutes;
