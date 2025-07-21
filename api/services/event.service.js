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
      to: emails?.join(", "),
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
    const event = await Event.findById(eventId)
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

    // Récupérer l'événement existant
    const event = await Event.findById(eventId);
    if (!event) {
      return ResponseService.notFound(res, { message: "Event not found" });
    }

    // Mettre à jour les champs de premier niveau
    if (updatedData.num_ref !== undefined) event.num_ref = updatedData.num_ref;
    if (updatedData.approved !== undefined)
      event.approved = updatedData.approved;

    // Mettre à jour details
    if (updatedData.details) {
      const details = updatedData.details;

      // Champs simples
      if (details.description !== undefined)
        event.details.description = details.description;
      if (details.descriptionDetailled !== undefined)
        event.details.descriptionDetailled = details.descriptionDetailled;
      if (details.event_date !== undefined)
        event.details.event_date = details.event_date;
      if (details.event_time !== undefined)
        event.details.event_time = details.event_time;
      if (details.detection_date !== undefined)
        event.details.detection_date = details.detection_date;
      if (details.approved_date !== undefined)
        event.details.approved_date = details.approved_date;
      if (details.closed_date !== undefined)
        event.details.closed_date = details.closed_date;
      if (details.effective_date !== undefined)
        event.details.effective_date = details.effective_date;
      if (details.recorded_by !== undefined)
        event.details.recorded_by = details.recorded_by;
      if (details.recorded_date !== undefined)
        event.details.recorded_date = details.recorded_date;
      if (details.total_currencies !== undefined)
        event.details.total_currencies = details.total_currencies;
      if (details.increment_currency !== undefined)
        event.details.increment_currency = details.increment_currency;
      if (details.total_losses !== undefined)
        event.details.total_losses = details.total_losses;
      if (details.cause !== undefined) event.details.cause = details.cause;
      if (details.title !== undefined) event.details.title = details.title;
      if (details.activeEvent !== undefined)
        event.details.activeEvent = details.activeEvent;
      if (details.excludeFundLosses !== undefined)
        event.details.excludeFundLosses = details.excludeFundLosses;
      if (details.notify !== undefined) event.details.notify = details.notify;
      if (details.externalEvent !== undefined)
        event.details.externalEvent = details.externalEvent;
      if (details.externalRef !== undefined)
        event.details.externalRef = details.externalRef;
      if (details.subentityOfDetection !== undefined)
        event.details.subentityOfDetection = details.subentityOfDetection;
      if (details.subentityOfOrigin !== undefined)
        event.details.subentityOfOrigin = details.subentityOfOrigin;
      if (details.RAG !== undefined) event.details.RAG = details.RAG;
      if (details.targetClosureDate !== undefined)
        event.details.targetClosureDate = details.targetClosureDate;
      if (details.document !== undefined)
        event.details.document = details.document;

      // Références : Owner, Nominee, Reviewer
      if (details.owner !== undefined) {
        const ownerProfile = await UserProfile.findById(details.owner);
        if (!ownerProfile) {
          return ResponseService.badRequest(res, {
            message: "Invalid owner ID",
          });
        }
        event.details.owner = ownerProfile._id;
      }
      if (details.nominee !== undefined) {
        const nomineeProfile = await UserProfile.findById(details.nominee);
        if (!nomineeProfile) {
          return ResponseService.badRequest(res, {
            message: "Invalid nominee ID",
          });
        }
        event.details.nominee = nomineeProfile._id;
      }
      if (details.reviewer !== undefined) {
        const reviewerProfile = await UserProfile.findById(details.reviewer);
        if (!reviewerProfile) {
          return ResponseService.badRequest(res, {
            message: "Invalid reviewer ID",
          });
        }
        event.details.reviewer = reviewerProfile._id;
      }

      // Références : Entities
      if (details.entityOfDetection !== undefined) {
        const entityDetection = await Entity.findById(
          details.entityOfDetection
        );
        if (!entityDetection) {
          return ResponseService.badRequest(res, {
            message: "Invalid entityOfDetection ID",
          });
        }
        event.details.entityOfDetection = entityDetection._id;
      }
      if (details.entityOfOrigin !== undefined) {
        const entityOrigin = await Entity.findById(details.entityOfOrigin);
        if (!entityOrigin) {
          return ResponseService.badRequest(res, {
            message: "Invalid entityOfOrigin ID",
          });
        }
        event.details.entityOfOrigin = entityOrigin._id;
      }
    }

    // Mettre à jour commentary
    if (updatedData.commentary !== undefined) {
      event.commentary = updatedData.commentary;
    }

    // Mettre à jour financials
    if (updatedData.financials !== undefined) {
      Object.assign(event.financials, updatedData.financials);
    }

    // Mettre à jour additionnalInfo
    if (updatedData.additionnalInfo !== undefined) {
      event.additionnalInfo = updatedData.additionnalInfo;
    }

    // Sauvegarder l'événement mis à jour
    await event.save();

    // Envoyer l'email si notify est true
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
            Date: ${event.details.event_date}<br><br>
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
    const events = await Event.find(entityCriteria)
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
      total: filteredEvents?.length || null,
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
    const entityObjectIds = targetEntityId.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthName = new Intl.DateTimeFormat("fr-FR", {
      month: "long",
    }).format(now);

    // 1. Récupérer tous les événements concernés
    const entityCriteria =
      entityObjectIds.length > 0
        ? {
            $or: [
              { "details.entityOfDetection": { $in: entityObjectIds } },
              { "details.entityOfOrigin": { $in: entityObjectIds } },
            ],
          }
        : {};

    const allEvents = await Event.find(entityCriteria)
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

    // 2. Filtrer les événements du mois courant
    const filteredEvents = allEvents.filter((e) => {
      const createdAt = new Date(e.createdAt);
      return (
        createdAt.getFullYear() === year && createdAt.getMonth() + 1 === month
      );
    });

    const allEvents2 = await Event.find();

    // 3. Récupérer les entités
    const entityDocs = await Entity.find({
      _id: { $in: entityObjectIds },
    }).lean();

    // 4. Regrouper les événements du mois par entité
    const eventsByEntityId = {};
    for (const id of entityObjectIds) {
      eventsByEntityId[id.toString()] = [];
    }

    for (const event of filteredEvents) {
      const detId =
        event.details?.entityOfDetection?._id?.toString() ||
        event.details?.entityOfDetection?.toString();

      const origId =
        event.details?.entityOfOrigin?._id?.toString() ||
        event.details?.entityOfOrigin?.toString();

      const matchingIds = entityObjectIds.filter((id) =>
        [detId, origId].includes(id.toString())
      );

      for (const matchId of matchingIds) {
        const key = matchId.toString();
        if (
          !eventsByEntityId[key].some(
            (e) => e._id.toString() === event._id.toString()
          )
        ) {
          eventsByEntityId[key].push(event);
        }
      }
    }

    // 4.bis. Regrouper TOUS les événements de l’année par entité
    const eventsYearByEntityId = {};
    for (const id of entityObjectIds) {
      eventsYearByEntityId[id.toString()] = [];
    }

    for (const event of allEvents) {
      const detId = event.details?.entityOfDetection?._id?.toString();
      const origId = event.details?.entityOfOrigin?._id?.toString();

      const matchingIds = entityObjectIds.filter((id) =>
        [detId, origId].includes(id.toString())
      );

      for (const matchId of matchingIds) {
        const key = matchId.toString();
        if (
          !eventsYearByEntityId[key].some(
            (e) => e._id.toString() === event._id.toString()
          )
        ) {
          eventsYearByEntityId[key].push(event);
        }
      }
    }

    // 6. Calcul des pertes
    const calculateTotalActualLoss = (events) => {
      return events
        .flatMap((item) => item?.financials?.data || [])
        .map((item) => item?.actualLoss?.total)
        .filter((val) => typeof val === "number" && !isNaN(val))
        .reduce((acc, val) => acc + val, 0);
    };

    const perteMonth = calculateTotalActualLoss(filteredEvents);
    const allPertes = calculateTotalActualLoss(await Event.find());

    // 5. Construire la structure finale : [{ entity, event: [], eventYearEntity: [] }]
    // const result = entityDocs.map((entity) => ({
    //   entity,
    //   event: eventsByEntityId[entity._id.toString()] || [],
    //   eventYearEntity: eventsYearByEntityId[entity._id.toString()] || [],
    // }));

    const result = entityDocs.map((entity) => {
      const event = eventsByEntityId[entity._id.toString()] || [];
      const eventYearEntity = eventsYearByEntityId[entity._id.toString()] || [];

      return {
        entity,
        event,
        eventYearEntity,
        perteMonth: calculateTotalActualLoss(event),
        allPertes: calculateTotalActualLoss(eventYearEntity),
      };
    });

    // 7. Ajouter infoSupp à la fin
    const infoSupp = {
      totalEvents: allEvents2.length,
      totalEventsMonth: filteredEvents.length,
      year,
      month,
      monthName,
      inforPertes: {
        perteMonth,
        allPertes,
      },
      entities: entityDocs,
    };

    // 8. Réponse finale
    return res.json({
      success: true,
      message: `Les événements du mois de ${monthName} ${year} ont été récupérés avec succès.`,
      data: [...result, { infoSupp }],
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
