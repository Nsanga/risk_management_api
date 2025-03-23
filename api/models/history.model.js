const mongoose = require("mongoose");
var historySchema = new mongoose.Schema(
  {
    reference: { type: String, unique: true },
    performance: { type: String, required: true },
    design: { type: String, required: true },
    assessedBy: { type: String, required: false },
    assessedOn: { type: String, required: true },
    efficiency: { type: String, required: true },
    cost: { type: String, required: false },
    currency: { type: String, required: true },
    dueOn: { type: String, required: false },
    note: { type: String, required: false },
    closeDate: { type: String, required: false },
    attested: { type: Boolean, required: false },
    idControl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EntityRiskControl",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("history", historySchema);
