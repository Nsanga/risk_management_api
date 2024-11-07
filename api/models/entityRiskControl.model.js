const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const riskSchema = new Schema({
  serialNumber: { type: String, required: true },
  businessFunction: { type: String, required: false },
  description: { type: String, required: true },
  outsourcedProcesses: { type: String, required: false },
  riskCategory: { type: String, required: true },
  riskEventCategory: { type: String, required: false },
  causalCategory: { type: String, required: false },
  riskSummary: { type: String, required: true },
  riskDescription: { type: String, required: true },
  occurrenceProbability: { type: String, required: false },
  riskImpact: { type: String, required: false },
  total: { type: String, required: false },
  users: { type: String, required: false },
  riskLevel: { type: String, required: false }
});

const controlSchema = new Schema({
  controlSummary: { type: String, required: true },
  controlDescription: { type: String, required: true },
  monitoringMethodology: { type: String, required: false },
  controlRating: { type: String, required: false },
  residualRiskLevel: { type: String, required: false },
  preventiveDetectiveControl: { type: String, required: false },
  monitoringCycle: { type: String, required: false },
  documentSources: { type: String, required: false },
  usersAgain: { type: String, required: false },
  status: { type: String, required: false }
});

const entityRiskControlSchema = new Schema({
  entity: {
    type: Schema.Types.ObjectId,
    ref: 'Entity',
    required: true
  },
  risks: [riskSchema],
  controls: [controlSchema],
}, { timestamps: true });

const EntityRiskControl = mongoose.model('EntityRiskControl', entityRiskControlSchema);

module.exports = EntityRiskControl;
