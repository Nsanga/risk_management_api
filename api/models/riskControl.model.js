const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schéma pour un risque
const riskSchema = new Schema({
  serialNumber: { type: Number, required: true }, // "S/N"
  departmentFunction: { type: String, required: true }, // "Departement/ Fonction"
  productProcessDescription: { type: String, required: true }, // "Produits/Processus/Description du système"
  outsourcedProcess: { type: String, required: true }, // "Processus Sous traités"
  riskCategory: { type: String, required: true }, // "Catégorie du Risque"
  riskEventCategory: { type: String, required: true }, // "Catégorie de l'évenement du risque"
  causalCategory: { type: String, required: true }, // "Catégorie causale"
  keyRiskSummary: { type: String, required: true }, // "Résumé Sommaire du Risque clé"
  keyRiskDescription: { type: String, required: true }, // "Description du risque clé"
  riskProbability: { type: Number, required: true }, // "Probabilité d'Occurrence du risque"
  riskImpact: { type: Number, required: true }, // "Impact du risque"
  total: { type: Number, required: true }, // "Total"
  riskLevel: { type: String, required: true } // "Niveau du Risque"
});

// Schéma pour un contrôle
const controlSchema = new Schema({
  keyControlSummary: { type: String, required: true }, // "Résumé du contrôle de clé"
  keyControlDescription: { type: String, required: true }, // "Description du contrôle de clé"
  controlMonitoringMethodology: { type: String, required: true }, // "Description de la méthodologie de surveillance du contrôle (plan de test)"
  controlRating: { type: String, required: true }, // "Note du Contrôle"
  residualRiskLevel: { type: String, required: true }, // "Niveau du risque résiduel"
  preventiveDetective: { type: String, required: true }, // "Control Preventife/Detectif"
  monitoringCycle: { type: String, required: true }, // "Cycle du suivi"
  documentSource: { type: String, required: true }, // "Source de documents consultés"
  controlStatus: { type: String, required: true } // "Existing/New/Obsolete"
});

// Schéma principal combinant les risques et les contrôles
const riskControlSchema = new Schema({
  tenantId: { type: String, required: true },
  risks: [riskSchema],
  controls: [controlSchema]
});

riskSchema.index({ tenantId: 1, serialNumber: 1 }, { unique: true });

// Modèle Mongoose pour les risques et contrôles
const RiskControl = mongoose.model('RiskControl', riskControlSchema);

module.exports = RiskControl;
