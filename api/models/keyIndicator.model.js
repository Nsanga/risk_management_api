const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dataKeyIndicatorSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  entityReference: { type: Schema.Types.ObjectId, ref: "Entity", required: true },
  reference: { type: String, required: true, unique: true },
  departmentFunction: { type: String },
  riskIndicatorDescription: { type: String },
  mesureKeyIndicator: { type: String },
  frequenceKeyIndicator: { type: String },
  calculMethodKeyIndicator: { type: String },
  toleranceKeyIndicator: { type: String },
  seuilKeyIndicator: { type: String },
  type: { type: String, default: "Numeric" },
  category: { type: String, default: "Key Risk Indicator" },
  escaladeKeyIndicator: { type: String },
  ownerKeyIndicator: { type: String },
  nomineeKeyIndicator: { type: String },
  reviewerKeyIndicator: { type: String },
  activeIndicator: { type: Boolean, default: true },
  treshold: { type: String, required: false },
  thresholdPercentage: { type: Boolean, default: true },
  remindOn: { type: String },
  reviewDate: { type: String },
  target: { type: String },
  status: { type: String, default: "active" },
});

const keyIndicatorSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true },
    entity: {
      type: Schema.Types.ObjectId,
      ref: "Entity",
      required: true,
    },
    dataKeyIndicators: [dataKeyIndicatorSchema],
  },
  { timestamps: true }
);

dataKeyIndicatorSchema.index({ tenantId: 1, entity: 1, reference: 1 }, { unique: true });

keyIndicatorSchema.pre("save", async function (next) {
  const tenantId = this.tenantId;
  const entityId = this.entity;

  for (const ind of this.dataKeyIndicators) {
    const exists = await mongoose.models.KeyIndicator.findOne({
      tenantId,
      entity: entityId,
      "dataKeyIndicators.reference": ind.reference,
    });

    if (exists) {
      return next(
        new Error(`L'indicateur avec la référence '${ind.reference}' existe déjà pour cette entité.`)
      );
    }
  }

  next();
});

module.exports = mongoose.model("KeyIndicator", keyIndicatorSchema);
