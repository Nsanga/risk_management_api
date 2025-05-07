const eventService = require('../services/event.service');

async function createEvent(req, res) {
  await eventService.createEvent(req, res);
}

async function getEventById(req, res) {
  return await eventService.getEventById(req, res);
}

async function updateEvent(req, res) {
  return await eventService.updateEvent(req, res);
}

async function deleteEvent(req, res) {
  return await eventService.deleteEvent(req, res);
}

async function getAllEvents(req, res) {
  return await eventService.getAllEvents(req, res);
}

module.exports = {
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  getAllEvents,
};
