const Event = require('../models/event.model');
const ResponseService = require('./response.service');
const UploadService = require('./uploadFile.service');

function generateReferenceNumber() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createEvent(req, res) {
  try {
    const eventData = req.body;
    eventData.num_ref = generateReferenceNumber();

    // Handle document upload
    if (req.files && req.files.length > 0) {
      const documentUrls = [];
      for (const file of req.files) {
        const documentUrl = await UploadService(file.originalname, file.buffer);
        documentUrls.push(documentUrl);
      }
      eventData.details.document = documentUrls;
    }

    const newEvent = new Event(eventData);
    await newEvent.save();
    return ResponseService.created(res, { message: 'Event created successfully', event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
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
    const updatedData = req.body;

    // Handle document upload
    if (req.files && req.files.length > 0) {
      const documentUrls = [];
      for (const file of req.files) {
        const documentUrl = await UploadService(file.originalname, file.buffer);
        documentUrls.push(documentUrl);
      }
      updatedData.details.document = documentUrls;
    }

    const event = await Event.findByIdAndUpdate(eventId, updatedData, { new: true });
    if (!event) {
      return ResponseService.notFound(res, { message: 'Event not found' });
    }
    return ResponseService.success(res, { message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Error updating event:', error);
    return ResponseService.internalServerError(res, { error: 'Error updating event' });
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
