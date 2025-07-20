const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dataKeyIndicatorSchema = new mongoose.Schema({
  
  reference: { type: String },
  entityReference: { type: Schema.Types.ObjectId, ref: "Entity" },
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
    entity: {
      type: Schema.Types.ObjectId,
      ref: "Entity",
      required: true,
    },
    dataKeyIndicators: [dataKeyIndicatorSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("KeyIndicator", keyIndicatorSchema);
