const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const riskSchema = new Schema(
    {
        tenantId: { type: String, required: true, index: true },
        entity: { type: Schema.Types.ObjectId, ref: "Entity", required: true },
        reference: { type: String, required: true, unique: true },
        serialNumber: { type: String, required: true },
        departmentFunction: { type: String, required: false },
        description: { type: String, required: true },
        outsourcedProcesses: { type: String, required: false },
        riskCategory: { type: String, required: true },
        riskEventCategory: { type: String, required: false },
        causalCategory: { type: String, required: false },
        riskSummary: { type: String, required: true },
        riskDescription: { type: String, required: true },
        occurrenceProbability: { type: String, required: false },
        riskImpact: { type: String, required: false },
        total: { type: String, required: false },
        ownerRisk: { type: String, required: false },
        nomineeRisk: { type: String, required: false },
        reviewerRisk: { type: String, required: false },
        riskLevel: { type: String, required: false },
        riskIndicatorDescription: { type: String, require: false },
        riskMesure: { type: String, require: false },
        frequenceCaptureRisk: { type: String, require: false },
        calculMethodRisk: { type: String, require: false },
        riskTolerence: { type: String, require: false },
        riskSeuil: { type: String, require: false },
        riskEscalade: { type: String, require: false },
        activeRisk: { type: Boolean, required: false, default: false },
        ownerEmail: { type: Boolean, required: false, default: false },
        remindOn: { type: String, require: false },
        evaluationDate: { type: String, require: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Risk", riskSchema);
