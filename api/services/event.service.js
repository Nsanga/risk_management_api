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

async function generateReferenceNumber() {
  const events = await Event.find();
  const nextNumber = (events.length + 1).toString().padStart(5, "0"); // Générer un nombre à 5 chiffres

  return nextNumber;
}

async function createEvent(req, res) {
  try {
    const eventData = req.body;
    eventData.num_ref = await generateReferenceNumber();

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
        html: `Un nouvel événement a été créé.<br><br>
        <strong>Détails de l'événement:</strong><br>
        Référence: EVT${eventData.num_ref}<br>
        Titre: ${eventData.details.description}<br>
        Date: ${eventData.details.event_date}<br>
        <br>
        <a href="https://futuriskmanagement.com" target="_blank">Cliquer ici pour vous connecter</a>`,
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

async function getEventByEntity(req, res) {
  try {
    const eventId = req.params.id;
    const events = await Event.find({
      $or: [
        { "details.entityOfDetection": eventId },
        { "details.entityOfOrigin": eventId },
      ],
    });

    if (!events || events.length === 0) {
      return ResponseService.notFound(res, {
        message: "Aucun événement trouvé",
      });
    }

    return ResponseService.success(res, { events });
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
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

    // Convertir les emails en ObjectId
    const ownerProfile = await UserProfile.findOne({
      _id: updatedData.details.owner,
    });
    const nomineeProfile = await UserProfile.findOne({
      _id: updatedData.details.nominee,
    });
    const reviewerProfile = await UserProfile.findOne({
      _id: updatedData.details.reviewer,
    });
    const entityOfDetection = await Entity.findById(
      updatedData.details.entityOfDetection
    );
    const entityOfOrigin = await Entity.findById(
      updatedData.details.entityOfOrigin
    );

    // Vérifiez si les profils et entités existent avant d'assigner leurs ObjectIds
    if (ownerProfile) updatedData.details.owner = ownerProfile._id;
    if (nomineeProfile) updatedData.details.nominee = nomineeProfile._id;
    if (reviewerProfile) updatedData.details.reviewer = reviewerProfile._id;
    if (entityOfDetection)
      updatedData.details.entityOfDetection = entityOfDetection._id;
    if (entityOfOrigin) updatedData.details.entityOfOrigin = entityOfOrigin._id;

    if (updatedData.details.notify) {
      const emails = [ownerProfile.email, nomineeProfile.email];

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails.join(", "),
        subject: "Notification de Création d'Événement",
        html: `Un nouvel événement a été créé.<br><br>
        <strong>Détails de l'événement:</strong><br>
        Référence: EVT${updatedData.num_ref}<br>
        Titre: ${updatedData.details.description}<br>
        Date: ${updatedData.details.event_date}<br>
        <br>
        <a href="https://futuriskmanagement.com" target="_blank">Cliquer ici pour vous connecter</a>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error("Error sending email:", error);
        } else {
          logger.info("Email sent:", info.response);
        }
      });
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
  getEventByEntity,
};
