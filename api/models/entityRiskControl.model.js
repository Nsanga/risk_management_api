const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const riskSchema = new Schema({
  reference: { type: String, unique: true, sparse: true },
  serialNumber: { type: String, required: true },
  departmentFunction: { type: String, required: false },
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
  ownerRisk: { type: String, required: false },
  nomineeRisk: { type: String, required: false },
  reviewerRisk: { type: String, required: false },
  riskLevel: { type: String, required: false },
  riskIndicatorDescription: { type: String, require: false },
  riskMesure: { type: String, require: false },
  frequenceCaptureRisk: { type: String, require: false },
  calculMethodRisk: { type: String, require: false },
  riskTolerence: { type: String, require: false },
  riskSeuil: { type: String, require: false },
  riskEscalade: { type: String, require: false },
  activeRisk: { type: Boolean, required: false, default: false },
  ownerEmail: { type: Boolean, required: false, default: false },
  remindOn: { type: String, require: false },
});

const controlSchema = new Schema({
  reference: { type: String, unique: true, sparse: true },
  controlSummary: { type: String, required: true },
  controlDescription: { type: String, required: true },
  monitoringMethodology: { type: String, required: false },
  controlRating: { type: String, required: false },
  residualRiskLevel: { type: String, required: false },
  preventiveDetectiveControl: { type: String, required: false },
  monitoringCycle: { type: String, required: false },
  documentSources: { type: String, required: false },
  ownerControl: { type: String, required: false },
  nomineeControl: { type: String, required: false },
  reviewerControl: { type: String, required: false },
  library: { type: String, required: false },
  status: { type: String, required: false },
  keyControl: { type: Boolean, required: false, default: false },
  activeControl: { type: Boolean, required: false, default: false },
});

const entityRiskControlSchema = new Schema(
  {
    entity: {
      type: Schema.Types.ObjectId,
      ref: "Entity",
      required: true,
    },
    risks: [riskSchema],
    controls: [controlSchema],
  },
  { timestamps: true }
);

const EntityRiskControl = mongoose.model(
  "EntityRiskControl",
  entityRiskControlSchema
);

module.exports = EntityRiskControl;
