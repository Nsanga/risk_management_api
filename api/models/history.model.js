const mongoose = require("mongoose");
var historySchema = new mongoose.Schema(
  {
    performance: { type: String, required: true },
    design: { type: String, required: true },
    assessedBY: { type: String, required: false },
    assessedOb: { type: String, required: true },
    efficiency: { type: String, required: true },
    cost: { type: String, required: false },
    currency: { type: String, required: true },
    dueOne: { type: String, required: false },
    note: { type: String, required: false },
    idControl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EntityRiskControl",
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("history", historySchema);
