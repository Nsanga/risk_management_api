const UserProfile = require("../models/userProfile.model");
const Entity = require("../models/entity.model");
const Event = require("../models/event.model");
const ResponseService = require("./response.service");
const nodemailer = require("nodemailer");
const logger = require("../helpers/logger");
const mongoose = require("mongoose");

const transporter = nodemailer.createTransport({
  service: "gmail", // Utilisez le service de messagerie de votre choix
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse email
    pass: process.env.EMAIL_PASS, // Votre mot de passe email ou un mot de passe d'application
  },
});

let currentNumber = 1; // Point de départ à 00001

async function generateReferenceNumber() {
  try {
    const lastAction = await Event.findOne().sort({ createdAt: -1 });
    let newReference = "00001";

    if (lastAction && lastAction.num_ref) {
      const lastReference = parseInt(lastAction.num_ref, 10);
      newReference = String(lastReference + 1).padStart(5, "0");
    }

    return newReference;
  } catch (error) {
    throw new Error(
      "Erreur lors de la génération de la référence: " + error.message
    );
  }
}

async function createEvent(req, res) {
  try {
    const eventData = req.body;

    // eventData.num_ref = await generateReferenceNumber();
    const num_ref = await generateReferenceNumber();
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

    const newEvent = new Event({ ...eventData, num_ref });
    await newEvent.save();

    const emails = [ownerProfile.email, nomineeProfile.email];
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails.join(", "),
      subject: "Notification de Création d'Événement",
      html: `Un nouvel événement a été créé.<br><br>
        <strong>Détails de l'événement:</strong><br>
        Référence: EVT${num_ref}<br>
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

    // Créer un objet de mise à jour contenant uniquement les champs fournis
    const updateFields = {};

    // Mettre à jour les champs de base s'ils sont présents dans la requête
    if (updatedData.num_ref !== undefined)
      updateFields.num_ref = updatedData.num_ref;
    if (updatedData.approved !== undefined)
      updateFields.approved = updatedData.approved;

    // Traiter les champs imbriqués dans details
    if (updatedData.details) {
      updateFields.details = updateFields.details || {};

      if (updatedData.details.description !== undefined)
        updateFields.details.description = updatedData.details.description;
      if (updatedData.details.event_date !== undefined)
        updateFields.details.event_date = updatedData.details.event_date;
      if (updatedData.details.owner !== undefined) {
        const ownerProfile = await UserProfile.findOne({
          _id: updatedData.details.owner,
        });
        if (ownerProfile) updateFields.details.owner = ownerProfile._id;
      }
      if (updatedData.details.nominee !== undefined) {
        const nomineeProfile = await UserProfile.findOne({
          _id: updatedData.details.nominee,
        });
        if (nomineeProfile) updateFields.details.nominee = nomineeProfile._id;
      }
      if (updatedData.details.reviewer !== undefined) {
        const reviewerProfile = await UserProfile.findOne({
          _id: updatedData.details.reviewer,
        });
        if (reviewerProfile)
          updateFields.details.reviewer = reviewerProfile._id;
      }
      if (updatedData.details.entityOfDetection !== undefined) {
        const entityOfDetection = await Entity.findById(
          updatedData.details.entityOfDetection
        );
        if (entityOfDetection)
          updateFields.details.entityOfDetection = entityOfDetection._id;
      }
      if (updatedData.details.entityOfOrigin !== undefined) {
        const entityOfOrigin = await Entity.findById(
          updatedData.details.entityOfOrigin
        );
        if (entityOfOrigin)
          updateFields.details.entityOfOrigin = entityOfOrigin._id;
      }
      if (updatedData.details.notify !== undefined)
        updateFields.details.notify = updatedData.details.notify;
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      { $set: updateFields },
      {
        new: true,
      }
    );

    if (!event) {
      return ResponseService.notFound(res, { message: "Event not found" });
    }

    // Envoyer l'email seulement si notify est true et présent dans la requête
    if (updatedData.details?.notify) {
      const ownerProfile = await UserProfile.findById(event.details.owner);
      const nomineeProfile = await UserProfile.findById(event.details.nominee);

      if (ownerProfile && nomineeProfile) {
        const emails = [ownerProfile.email, nomineeProfile.email];

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: emails.join(", "),
          subject: "Notification de Mise à Jour d'Événement",
          html: `Un événement a été mis à jour.<br><br>
            <strong>Détails de l'événement:</strong><br>
            Référence: EVT${event.num_ref}<br>
            Titre: ${event.details.description}<br>
            Date: ${event.details.event_date}<br>
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

// async function getDataRapportEvent(req, res) {
//   const { targetEntityId, startDate, endDate } = req.body;

//   try {
//     const entityObjectIds = targetEntityId.map(
//       (id) => new mongoose.Types.ObjectId(id)
//     );

//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     end.setHours(23, 59, 59, 999);

//     const events = await Event.find();

//     const filteredEvents = events.filter((event) => {
//       const created = new Date(event.createdAt);

//       const isEntityMatch =
//         entityObjectIds.some((id) =>
//           id.equals(event.details.entityOfDetection)
//         ) ||
//         entityObjectIds.some((id) => id.equals(event.details.entityOfOrigin));

//       const isDateMatch = created >= start && created <= end;

//       return isEntityMatch || isDateMatch;
//     });

//     return res.json({
//       success: true,
//       message: "Tous les évènements ont été récupérés avec succès.",
//       data: filteredEvents,
//       total: filteredEvents.length,
//     });
//   } catch (error) {
//     console.error("Erreur lors de la récupération des événements :", error);
//     return res.status(500).json({
//       success: false,
//       message:
//         "Une erreur est survenue lors de la récupération des événements.",
//       error: error.message,
//     });
//   }
// }

async function getDataRapportEvent(req, res) {
  const { targetEntityId = [], startDate, endDate } = req.body;

  try {
    /* ---------- 1. Préparation des critères ---------- */
    const entityObjectIds = targetEntityId.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    // Critère entité
    const entityCriteria =
      entityObjectIds.length > 0
        ? {
            $or: [
              { "details.entityOfDetection": { $in: entityObjectIds } },
              { "details.entityOfOrigin": { $in: entityObjectIds } },
            ],
          }
        : null;

    // Critère date de création
    const dateCriteria =
      start && end ? { createdAt: { $gte: start, $lte: end } } : null;

    // Fusion (OR) des critères présents
    const finalQuery =
      entityCriteria && dateCriteria
        ? { $or: [entityCriteria, dateCriteria] }
        : entityCriteria || dateCriteria || {}; // aucun critère → tout

    /* ---------- 2. Requête Mongo avec populate ---------- */
    const events = await Event.find(finalQuery)
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
      })
      .lean(); // objets JS plats, plus léger

    /* ---------- 3. Réponse ---------- */
    return res.json({
      success: true,
      message: "Tous les évènements ont été récupérés avec succès.",
      data: events,
      total: events.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des événements :", error);
    return res.status(500).json({
      success: false,
      message:
        "Une erreur est survenue lors de la récupération des événements.",
      error: error.message,
    });
  }
}

module.exports = { getDataRapportEvent };

module.exports = {
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEventByEntity,
  getDataRapportEvent,
};
