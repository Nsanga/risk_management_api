const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const financialsSchema = new mongoose.Schema({
  Total: { type: Number, default: 0 },
  Direct: { type: Number, default: 0 },
  'Amendes réglementaires': { type: Number, default: 0 },
  'Dépréciation d\'actif': { type: Number, default: 0 },
  Other: { type: Number, default: 0 },
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
  // Référence et identification
  num_ref: { type: String },
  
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
    
    // Information financière basique
    rate: String,
    total_currencies: String,
    increment_currency: String,
    total_losses: String,
    
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
    targetClosureDate: String,
    
    // Documents associés
    document: [String], // Pour gérer une URL unique ou un tableau d'URLs
  },
  
  // Commentaire
  commentary: {
    comment: String,
  },
  
  // Données financières détaillées
  financials: {
    createdAt: { type: Date, default: Date.now },
    currency: { type: String, default: 'USD', enum: ['USD', 'EUR', 'XAF'] },
    totalConverted: { type: Number, default: 0 },
    data: {
      'Actual Loss': financialsSchema,
      'Potential Loss': financialsSchema,
      'Actual Recovery': financialsSchema,
      'Expected Recovery': financialsSchema,
      'Recovery Expenses': financialsSchema,
      'Insurance Recovery': financialsSchema, 
      'Near Miss': financialsSchema,
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
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;