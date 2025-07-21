const UserProfile = require("../models/userProfile.model");
const Event = require("../models/event.model");
const ResponseService = require("./response.service");
const nodemailer = require("nodemailer");
const logger = require("../helpers/logger");
const mongoose = require("mongoose");
const Entity = require("../models/entity.model");

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
      "Erreur lors de la génération de la référence : " + error.message
    );
  }
}

async function createEvent(req, res) {
  try {
     // ✅ récupération du tenant courant
    const eventData = req.body;
    const num_ref = await generateReferenceNumber();

    // Recherche sécurisée des utilisateurs et entités par tenant
    const ownerProfile = await UserProfile.findOne({
      _id: eventData.details.owner,
      
    });

    const nomineeProfile = await UserProfile.findOne({
      _id: eventData.details.nominee,
      
    });

    const reviewerProfile = await UserProfile.findOne({
      _id: eventData.details.reviewer,
      
    });

    const entityOfDetection = await Entity.findOne({
      _id: eventData.details.entityOfDetection,
      
    });

    const entityOfOrigin = await Entity.findOne({
      _id: eventData.details.entityOfOrigin,
      
    });

    // Vérifie si les entités et profils existent
    if (!ownerProfile || !nomineeProfile) {
      return ResponseService.badRequest(res, {
        message: "Owner or Nominee not found for this tenant.",
      });
    }

    if (ownerProfile) eventData.details.owner = ownerProfile._id;
    if (nomineeProfile) eventData.details.nominee = nomineeProfile._id;
    if (reviewerProfile) eventData.details.reviewer = reviewerProfile._id;
    if (entityOfDetection)
      eventData.details.entityOfDetection = entityOfDetection._id;
    if (entityOfOrigin) eventData.details.entityOfOrigin = entityOfOrigin._id;

    const newEvent = new Event({
      ...eventData,
      num_ref,
    });

    await newEvent.save();

    if (eventData.details?.notify && eventData.approved) {
      // Envoi d'email
      const emails = [ownerProfile.email, nomineeProfile.email];
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emails.join(", "),
        subject: "Notification de Création d'Événement",
        html: `Un nouvel événement a été créé.<br><br>
        <strong>Détails de l'événement:</strong><br>
        Référence: EVT${num_ref}<br>
        Titre: ${eventData.details.description}<br>
        Date: ${eventData.details.event_date}<br><br>
        <a href="https://futuriskmanagement.com" target="_blank">Cliquer ici pour vous connecter</a>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          logger.error("Erreur lors de l'envoi de l'email :", error);
        } else {
          logger.info("Email envoyé :", info.response);
        }
      });
    }

    return ResponseService.created(res, {
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    logger.error("Erreur lors de la création de l'événement :", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getEventById(req, res) {
  try {
     // 👈 Récupération du tenant courant
    const eventId = req.params.id;

    const event = await Event.findOne({ _id: eventId })
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

    if (!event) {
      return ResponseService.notFound(res, {
        message: "Événement non trouvé ou non accessible pour ce tenant.",
      });
    }

    return ResponseService.success(res, { event });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement:", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function getEventByEntity(req, res) {
  try {
    
    const entityId = req.params.id;

    const events = await Event.find({
      
      $or: [
        { "details.entityOfDetection": entityId },
        { "details.entityOfOrigin": entityId },
      ],
    });

    if (!events || events.length === 0) {
      return ResponseService.notFound(res, {
        message: "Aucun événement trouvé pour cette entité dans ce tenant.",
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

    // 🔐 Récupérer l'événement en filtrant aussi par tenant
    const event = await Event.findOne({ _id: eventId });
    if (!event) {
      return ResponseService.notFound(res, { message: "Event not found" });
    }

    // ✅ Mise à jour simple de champs de premier niveau
    const topFields = ['num_ref', 'approved', 'commentary', 'additionnalInfo'];
    topFields.forEach(field => {
      if (updatedData[field] !== undefined) event[field] = updatedData[field];
    });

    if (updatedData.financials !== undefined) {
      event.financials = {
        currency: updatedData.financials.currency || event.financials?.currency || 'XAF',
        totalConverted: updatedData.financials.totalConverted || event.financials?.totalConverted || 0,
        data: {
          ...event.financials?.data,
          ...updatedData.financials.data
        }
      };
    }

    // ✅ Mise à jour des détails
    if (updatedData.details) {
      const details = updatedData.details;
      const simpleDetailFields = [
        'description', 'descriptionDetailled', 'event_date', 'event_time',
        'detection_date', 'approved_date', 'closed_date', 'effective_date',
        'recorded_by', 'recorded_date', 'total_currencies', 'increment_currency',
        'total_losses', 'cause', 'title', 'activeEvent', 'excludeFundLosses',
        'notify', 'externalEvent', 'externalRef', 'subentityOfDetection',
        'subentityOfOrigin', 'RAG', 'targetClosureDate', 'document'
      ];

      simpleDetailFields.forEach(field => {
        if (details[field] !== undefined) {
          event.details[field] = details[field];
        }
      });

      const referenceFields = [
        { key: 'owner', model: UserProfile },
        { key: 'nominee', model: UserProfile },
        { key: 'reviewer', model: UserProfile, optional: true },
        { key: 'entityOfDetection', model: Entity },
        { key: 'entityOfOrigin', model: Entity }
      ];
      
      for (const { key, model, optional } of referenceFields) {
        if (details[key] === null && optional) {
          event.details[key] = null;
        } else if (details[key] !== undefined && details[key] !== null) {
          const doc = await model.findOne({ _id: details[key] });
          if (!doc) return ResponseService.badRequest(res, { message: `Invalid ${key} ID` });
          event.details[key] = doc._id;
        } else if (!optional) {
          return ResponseService.badRequest(res, { message: `${key} is required` });
        }
      }
    }

    // ✅ Sauvegarde
    await event.save();

    // ✅ Envoi de notification si demandé
    if (updatedData.details?.notify && updatedData.approved) {
      const [owner, nominee] = await Promise.all([
        UserProfile.findOne({ _id: event.details.owner }),
        UserProfile.findOne({ _id: event.details.nominee }),
      ]);

      if (owner && nominee) {
        const emails = [owner.email, nominee.email];
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: emails.join(", "),
          subject: "Notification de Mise à Jour d'Événement",
          html: `Un événement a été mis à jour.<br><br>
            <strong>Détails de l'événement:</strong><br>
            Référence: EVT${event.num_ref}<br>
            Titre: ${event.details.description}<br>
            Date: ${event.details.event_date}<br><br>
            <a href="https://futuriskmanagement.com" target="_blank">Cliquer ici pour vous connecter</a>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            logger.error("Erreur lors de l'envoi de l'email :", error);
          } else {
            logger.info("Email envoyé :", info.response);
          }
        });
      }
    }

    return ResponseService.success(res, {
      message: "Event updated successfully",
      event,
    });

  } catch (error) {
    logger.error("Erreur lors de la mise à jour de l'événement:", error);
    return ResponseService.internalServerError(res, { error: error.message });
  }
}

async function deleteEvent(req, res) {
  try {
    
    const eventId = req.params.id;

    const event = await Event.findOneAndDelete({ _id: eventId });

    if (!event) {
      return ResponseService.notFound(res, {
        message: "Événement non trouvé ou non accessible pour ce tenant.",
      });
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
    

    // 🔐 Ne retourne que les événements du tenant courant
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

    // 1. Critère entité obligatoire si fourni
    const entityCriteria =
      entityObjectIds.length > 0
        ? {
          $or: [
            { "details.entityOfDetection": { $in: entityObjectIds } },
            { "details.entityOfOrigin": { $in: entityObjectIds } },
          ],
        }
        : {};

    /* ---------- 2. Requête Mongo avec populate ---------- */
    const events = await Event.find({ entityCriteria })
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
      .lean();

    /* ---------- 3. Filtrage par date (post-traitement) ---------- */
    const filteredEvents =
      start && end
        ? events.filter((e) => {
          const created = new Date(e.createdAt);
          return created >= start && created <= end;
        })
        : events;

    /* ---------- 4. Réponse ---------- */
    return res.json({
      success: true,
      message: "Les événements ont été récupérés avec succès.",
      data: filteredEvents,
      total: filteredEvents.length,
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

async function getRapportIncident(req, res) {
  
  const { targetEntityId = [] } = req.body;

  try {
    /* ---------- 1. Préparation des critères ---------- */
    const entityObjectIds = targetEntityId.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const now = new Date();
    const year = now.getFullYear(); // ex: 2025
    const month = now.getMonth() + 1; // ex: 7 (juillet) - on ajoute 1 car getMonth() retourne un index de 0 à 11
    const monthName = new Intl.DateTimeFormat("fr-FR", {
      month: "long",
    }).format(now);

    // 1. Critère entité obligatoire si fourni
    const entityCriteria =
      entityObjectIds.length > 0
        ? {
          $or: [
            { "details.entityOfDetection": { $in: entityObjectIds } },
            { "details.entityOfOrigin": { $in: entityObjectIds } },
          ],
        }
        : {};

    /* ---------- 2. Requête Mongo avec populate ---------- */
    const events = await Event.find({ entityCriteria })
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
      .lean();

    /* ---------- 3. Filtrage par date (post-traitement) ---------- */
    /* ---------- 3. Filtrage par date (mois en cours) ---------- */
    // 1. Fonction utilitaire pour calculer la somme des pertes à partir d'une liste d'événements
    const calculateTotalActualLoss = (events) => {
      return events
        .flatMap((item) => item?.financials?.data || [])
        .map((item) => item?.actualLoss?.total)
        .filter((val) => typeof val === "number" && !isNaN(val))
        .reduce((acc, val) => acc + val, 0);
    };

    // 2. Sélection des événements du mois courant
    const filteredEvents = events.filter((e) => {
      const createdAt = new Date(e.createdAt);
      return (
        createdAt.getFullYear() === year && createdAt.getMonth() + 1 === month
      );
    });

    // 3. Récupération de toutes les entités concernées
    const entities = await Entity.find({ _id: { $in: entityObjectIds } });
    const allEvents = await Event.find();

    // 4. Calcul des pertes
    const perteMonth = calculateTotalActualLoss(filteredEvents);
    const allPertes = calculateTotalActualLoss(await Event.find());

    // 5. Regroupement
    const inforPertes = {
      perteMonth,
      allPertes,
    };

    const infoSupp = {
      totalEvents: allEvents?.length,
      totalEventsMonth: filteredEvents.length,
      year,
      month,
      monthName,
      inforPertes,
      entities,
    };

    /* ---------- 4. Réponse ---------- */
    return res.json({
      success: true,
      message: `Les événements du mois de ${monthName} ${year} ont été récupérés avec succès.`,
      data: filteredEvents,
      infoSupp: infoSupp,
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

// module.exports = { getDataRapportEvent };

module.exports = {
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEventByEntity,
  getDataRapportEvent,
  getRapportIncident,
};