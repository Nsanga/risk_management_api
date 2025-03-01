const UserProfile = require("../models/userProfile.model");
const Entity = require("../models/entity.model");
const Event = require("../models/event.model");
const ResponseService = require("./response.service");
const nodemailer = require("nodemailer");
const logger = require("../helpers/logger");

const transporter = nodemailer.createTransport({
  service: "gmail", // Utilisez le service de messagerie de votre choix
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse email
    pass: process.env.EMAIL_PASS, // Votre mot de passe email ou un mot de passe d'application
  },
});

let currentNumber = 1; // Point de départ à 00001

function generateReferenceNumber() {
  if (currentNumber > 99999) {
    // Réinitialiser à 1 si la limite de 99999 est atteinte
    currentNumber = 1;
  }

  const referenceNumber = currentNumber.toString().padStart(5, "0");
  currentNumber++; // Incrémenter pour le prochain numéro
  return referenceNumber;
}

async function createEvent(req, res) {
  try {
    const eventData = req.body;
    eventData.num_ref = generateReferenceNumber();

    // Convertir les emails en ObjectId
    const ownerProfile = await UserProfile.findOne({
      _id: eventData.details.owner,
    });
    const nomineeProfile = await UserProfile.findOne({
      _id: eventData.details.nominee,
    });
    const reviewerProfile = await UserProfile.findOne({
      _id: eventData.details.reviewer,
    });
    const entityOfDetection = await Entity.findById(
      eventData.details.entityOfDetection
    );
    const entityOfOrigin = await Entity.findById(
      eventData.details.entityOfOrigin
    );

    // Vérifiez si les profils et entités existent avant d'assigner leurs ObjectIds
    if (ownerProfile) eventData.details.owner = ownerProfile._id;
    if (nomineeProfile) eventData.details.nominee = nomineeProfile._id;
    if (reviewerProfile) eventData.details.reviewer = reviewerProfile._id;
    if (entityOfDetection)
      eventData.details.entityOfDetection = entityOfDetection._id;
    if (entityOfOrigin) eventData.details.entityOfOrigin = entityOfOrigin._id;

    const newEvent = new Event(eventData);
    await newEvent.save();


    if (eventData.details.notify) {
      const emails = [ownerProfile.email, nomineeProfile.email];

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails.join(", "),
      subject: "Notification de Création d'Événement",
      text: `Un nouvel événement a été créé.\n\nDétails de l'événement:\nRéférence: EVT${eventData.num_ref}\nTitre: ${eventData.details.description}\nDate: ${eventData.details.event_date}`,
    };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error("Error sending email:", error);
        } else {
          logger.info("Email sent:", info.response);
        }
      });
    }

    return ResponseService.created(res, {
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    logger.error("Error creating event:", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getEventById(req, res) {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseService.notFound(res, { message: "Événement non trouvé" });
    }
    return ResponseService.success(res, { event });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement:", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function updateEvent(req, res) {
  try {
    const eventId = req.params.id;
    const updatedData = req.body;

    const event = await Event.findByIdAndUpdate(eventId, updatedData, {
      new: true,
    });

    if (!event) {
      return ResponseService.notFound(res, { message: "Event not found" });
    }

    return ResponseService.success(res, {
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    logger.error("Error updating event:", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function deleteEvent(req, res) {
  try {
    const eventId = req.params.id;
    const event = await Event.findByIdAndDelete(eventId);
    if (!event) {
      return ResponseService.notFound(res, { message: "Événement non trouvé" });
    }
    return ResponseService.success(res, {
      message: "Événement supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement:", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getAllEvents(req, res) {
  try {
    const events = await Event.find()
      .populate({
        path: "details.entityOfDetection",
        select: "referenceId description",
        strictPopulate: true,
      })
      .populate({
        path: "details.entityOfOrigin",
        select: "referenceId description",
        strictPopulate: true,
      })
      .populate({
        path: "details.owner",
        select: "name surname",
        strictPopulate: true,
      })
      .populate({
        path: "details.nominee",
        select: "name surname",
        strictPopulate: true,
      })
      .populate({
        path: "details.reviewer",
        select: "name surname",
        strictPopulate: true,
      });

    return ResponseService.success(res, { events });
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
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
