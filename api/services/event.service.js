const Event = require('../models/event.model');
const ResponseService = require('./response.service');
const UploadService = require('./uploadFile.service');

async function createEvent(req, res) {
  try {
    const eventData = req.body;
    const files = req.files;

    let documentUrls = [];
    if (files && files.length > 0) {
      documentUrls = await UploadService.uploadMultipleFiles(files);
      eventData.document = documentUrls;
    }

    const newEvent = new Event(eventData);
    await newEvent.save();

    return ResponseService.created(res, { message: 'Event created successfully', event: newEvent });
  } catch (error) {
    console.log('Error creating event:', error);
    return ResponseService.internalServerError(res, { error: 'Error creating event' });
  }
}

async function getEventById(req, res) {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseService.notFound(res, { message: 'Événement non trouvé' });
    }
    return ResponseService.success(res, { event });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    return ResponseService.internalServerError(res, { error: error.message }); 
  } 
}

async function updateEvent(req, res) {
  try {
    const eventId = req.params.id;
    const updates = req.body;
    const event = await Event.findByIdAndUpdate(eventId, updates, { new: true });
    if (!event) {
      return ResponseService.notFound(res, { message: 'Événement non trouvé' });
    }
    return ResponseService.success(res, { message: 'Événement mis à jour avec succès', event });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function deleteEvent(req, res) {
  try {
    const eventId = req.params.id;
    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      return ResponseService.notFound(res, { message: 'Événement non trouvé' });
    }
    return ResponseService.success(res, { message: 'Événement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getAllEvents(req, res) {
  try {
    const events = await Event.find();
    return ResponseService.success(res, { events });
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

module.exports = {
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  getAllEvents,
};
