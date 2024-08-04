const Event = require('../models/event.model');
const ResponseService = require('./response.service');
const nodemailer = require('nodemailer');
const logger = require('../helpers/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Utilisez le service de messagerie de votre choix
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse email
    pass: process.env.EMAIL_PASS  // Votre mot de passe email ou un mot de passe d'application
  }
}); 

function generateReferenceNumber() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createEvent(req, res) {
  try { 
    const eventData = req.body;
    eventData.num_ref = generateReferenceNumber();

    const newEvent = new Event(eventData);
    await newEvent.save();

    if (eventData.details.notify) {
      const emails = [eventData.details.owner, eventData.details.nominee];

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails.join(', '),
        subject: 'Notification de Création d\'Événement',
        text: `Un nouvel événement a été créé.\n\nDétails de l'événement:\nRéférence: ${eventData.num_ref}\nTitre: ${eventData.details.title}\nDate: ${eventData.details.event_date}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error('Error sending email:', error);
        } else {
          logger.info('Email sent:', info.response);
        }
      });
    }

    return ResponseService.created(res, { message: 'Event created successfully', event: newEvent });
  } catch (error) {
    logger.error('Error creating event:', error);
    return ResponseService.internalServerError(res, { error: error.message });
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

    const event = await Event.findByIdAndUpdate(eventId, updatedData, { new: true });

    if (!event) {
      return ResponseService.notFound(res, { message: 'Event not found' });
    }

    return ResponseService.success(res, { message: 'Event updated successfully', event });
  } catch (error) {
    logger.error('Error updating event:', error);
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
