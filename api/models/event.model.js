const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const financialsSchema = new mongoose.Schema({
  total: { type: Number, default: 0 },
  direct: { type: Number, default: 0 },
  regulatoryFines: { type: Number, default: 0 },
  assetImpairment: { type: Number, default: 0 },
  other: { type: Number, default: 0 },
}, { _id: false });

const additionnalInfoSchema = new Schema(
  {
    category: String,
    topLevel: String,
    description: String,
  },
  { _id: false }
);

const eventSchema = new Schema({
  tenantId: { type: String, required: true },

  // Référence et identification
  num_ref: { type: String, required: true },

  // Détails de l'événement
  details: {
    // Dates importantes
    event_date: Date,
    event_time: String,
    detection_date: Date,
    approved_date: Date,
    closed_date: Date,
    effective_date: Date,

    // Information d'enregistrement
    recorded_by: String,
    recorded_date: Date,

    // Description et cause
    description: String,
    descriptionDetailled: String,
    cause: String,

    // Responsables
    owner: {
      type: Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
    },
    nominee: {
      type: Schema.Types.ObjectId,
      ref: "UserProfile",
      required: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "UserProfile",
      required: false,
      default: null,
    },
    reviewer_date: Date,

    // Métadonnées
    title: String,
    activeEvent: Boolean,
    excludeFundLosses: Boolean,
    notify: Boolean,
    externalEvent: Boolean,
    externalRef: String,

    // Entités concernées
    entityOfDetection: {
      type: Schema.Types.ObjectId,
      ref: "Entity",
      required: true,
    },
    subentityOfDetection: String,
    entityOfOrigin: {
      type: Schema.Types.ObjectId,
      ref: "Entity",
      required: true,
    },
    subentityOfOrigin: String,

    // Gestion d'état
    RAG: String,
    targetClosureDate: Date,

    // Documents associés
    document: [String], // Pour gérer une URL unique ou un tableau d'URLs
  },

  // Commentaire
  commentary: {
    comment: String,
  },

  // Données financières détaillées
  financials: {
    currency: { type: String, default: 'XAF', enum: ['USD', 'EUR', 'XAF'] },
    totalConverted: { type: Number, default: 0 },
    data: {
      actualLoss: financialsSchema,
      potentialLoss: financialsSchema,
      actualRecovery: financialsSchema,
      expectedRecovery: financialsSchema,
      recoveryExpenses: financialsSchema,
      insuranceRecovery: financialsSchema,
      nearMiss: financialsSchema,
    },
  },

  // Informations supplémentaires
  additionnalInfo: [additionnalInfoSchema],

  // Métadonnées du document
  createdAt: {
    type: Date,
    default: Date.now,
  },
  approved: {
    type: Boolean,
    default: false,
  },
},
  { timestamps: true }
);

eventSchema.index({ tenantId: 1, num_ref: 1 }, { unique: true });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;