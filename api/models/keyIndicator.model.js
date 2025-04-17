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
