const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const controlSchema = new Schema(
    {
        tenantId: { type: String, required: true, index: true },
        entityId: { type: Schema.Types.ObjectId, ref: "Entity", required: true },
        reference: { type: String, required: true, unique: true },
        riskId: { type: Schema.Types.ObjectId, ref: "Risk", required: false },
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
        activeControl: { type: Boolean, required: false, default: true },
        reviewDate: { type: String, required: false },
        lastOperation: { type: String, required: false },
        nextOperation: { type: String, required: false },
        frequence: { type: String, required: false },
        nextAssessMent: { type: String, required: false, default: "" },
        history: {
            type: Schema.Types.ObjectId,
            ref: "History",
            required: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Control", controlSchema);
