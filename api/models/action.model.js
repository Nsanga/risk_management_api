const mongoose = require("mongoose");

var actionSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true },
    reference: { type: String },
    descriptionAction: { type: String, required: false },
    delaisAction: { type: String, required: false },
    proprioAction: { type: String, required: false },
    evolutionAction: { type: String, required: false },
    emailProprio: { type: String, required: false },
    author: { type: String, required: false },
    idControl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EntityRiskControl",
      required: false,
    },
    idEntity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Entity",
      required: false,
    },
    idHistory: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: "history",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("actions", actionSchema);
