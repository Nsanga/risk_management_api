const mongoose = require("mongoose");
var historySchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true },
    reference: { type: String, unique: true },
    performance: { type: String, required: false },
    design: { type: String, required: false },
    assessedBy: { type: String, required: false },
    assessedOn: { type: String, required: false },
    efficiency: { type: String, required: false },
    cost: { type: String, required: false },
    currency: { type: String, required: false },
    dueOn: { type: String, required: false },
    note: { type: String, required: false },
    closeDate: { type: String, required: false },
    attested: { type: Boolean, required: false },
    frequency: { type: String, required: false },
    coutAnnually: { type: String, required: false },
    author: { type: String, required: false },
    idControl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EntityRiskControl",
      required: false,
    },
  },
  { timestamps: true }
);

historySchema.index({ tenantId: 1, reference: 1 }, { unique: true });

module.exports = mongoose.model("history", historySchema);
