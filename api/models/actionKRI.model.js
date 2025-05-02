const mongoose = require("mongoose");

const actionKRISchema = new mongoose.Schema(
  {
    reference: { type: String },
    originatingRiskRef: { type: String, required: false },
    actionState: { type: String, required: false },
    source: { type: String, required: false },
    priority: { type: String, required: false },
    descriptionAction: { type: String, required: false },
    commentary: { type: String, required: false },
    progress: { type: String, required: false },
    log: { type: String, required: false },
    actionFcus: { type: String, required: false },
    owner: { type: String, required: false },
    nominee: { type: String, required: false },
    reviewer: { type: String, required: false },
    reviewerDate: { type: String, required: false },
    isTargetDate: { type: Boolean, default: false },
    targetDate: { type: String, required: false },
    cost: { type: String, required: false },
    currency: { type: String, required: false },
    idKeyIndicator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KeyIndicator",
      required: false,
    },
    idEntity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Entity",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("kRI_Action", actionKRISchema);
