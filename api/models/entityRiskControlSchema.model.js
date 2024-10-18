const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sous-schema pour les risques
const riskSchema = new Schema({
  activeRisk: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    required: false
  },
  frequency: {
    type: String,
    default: 'N/A'
  },
  nominee: {
    type: Schema.Types.ObjectId,
    ref: 'UserProfile',
    default: null
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'UserProfile',
    required: false
  },
  ownerEmailChecked: {
    type: Boolean,
    default: false
  },
  remindOne: {
    type: Date,
    required: false
  },
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'UserProfile',
    default: null
  }
}, { timestamps: true });

// Sous-schema pour les contrôles
const controlSchema = new Schema({
  activeControl: {
    type: Boolean,
    default: true
  },
  controlCategory: {
    type: String,
    required: false
  },
  controlRef: {
    type: String,
    required: false,
    unique: true
  },
  description: {
    type: String,
    required: false
  },
  frequency: {
    type: String,
  },
  frequencyAssessment: {
    type: String,
  },
  keyControl: {
    type: Boolean,
    default: false
  },
  lastOperation: {
    type: Date,
    required: false
  },
  nextOperation: {
    type: Date,
    required: false
  },
  nextAssessment: {
    type: Date,
    required: false
  },
  nominee: {
    type: Schema.Types.ObjectId,
    ref: 'UserProfile',
    default: null
  },
  reviewDate: {
    type: Date,
    required: false
  },
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'UserProfile',
    default: null
  }
}, { timestamps: true });

// Schema principal
const entityRiskControlSchema = new Schema({
  businessLine: {
    type: String,
    required: true
  },
  cbrDescription: {
    type: String,
    default: '[N/A]'
  },
  description: {
    type: String,
    required: false
  },
  dismissalCategory: {
    type: String,
    required: false
  },
  entity: {
    type: Schema.Types.ObjectId,
    ref: 'Entity',
    required: true
  },
  linkedRisk: {
    type: String,
    required: false
  },
  location: {
    type: String,
    required: true
  },
  residualAnnExp: {
    type: String,
    required: true,
    default: '0.00'
  },
  residualScore: {
    type: String,
    required: true,
    default: '0.00'
  },
  residualSeverity: {
    type: String,
    required: false
  },
  currency: {
    type: String,
    required: true,
    default: 'USD' // Ajout du champ pour la devise
  },
  riskActions: {
    type: String,
    default: '0'
  },
  riskCategory: {
    type: String,
    required: false
  },
  riskRef: {
    type: String,
    required: false
  },
  riskStatus: {
    type: String,
    required: true,
    default: 'Approved'
  },
  risks: [riskSchema], // Liste des risques
  controls: [controlSchema] // Liste des contrôles
}, { timestamps: true });

const EntityRiskControl = mongoose.model('EntityRiskControl', entityRiskControlSchema);

module.exports = EntityRiskControl;
