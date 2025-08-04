const mongoose = require("mongoose");
var historyKRI = new mongoose.Schema(
  {
    tenantId: { type: String, required: true },
    avage: { type: String, required: false },
    period: { type: String, required: false },
    time: { type: String, required: false },
    value: { type: String, required: false },
    comment: { type: String, required: false },
    status: { type: String, required: false, default: "active" },
    coutAnnually: { type: String, required: false },
    author: { type: String, required: false },
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

module.exports = mongoose.model("kRI_History", historyKRI);
