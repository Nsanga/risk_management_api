const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const financialsSchema = new Schema({
    id: Number,
    name: String,
    values: [Number]
}, { _id: false });

const additionnalInfoSchema = new Schema({
    category: String,
    description: String
}, { _id: false });

const eventSchema = new Schema({
    num_ref: {
        type: String,
        unique: true,
        required: true,
    },
    details: {
        event_date: Date,
        event_time: String,
        detection_date: Date,
        approved_date: Date,
        closed_date: Date,
        effective_date: Date,
        rate: String,
        total_currencies: String,
        increment_currency: String,
        total_losses: String,
        description: String,
        cause: String,
        entity: String,
        sub_entity: String,
        owner: String,
        reviewer: String,
        title: String,
        activeEvent: Boolean,
        excludeFundLosses: Boolean,
        notify: Boolean,
        externalEvent: Boolean,
        entityOfDetection: String,
        subentityOfDetection: String,
        entityOfOrigin: String,
        subentityOfOrigin: String,
        RAG: String,
        document: [String] // To handle both single URL and array of URLs
    },
    commentary: {
        comment: String
    },
    financials: [financialsSchema],
    additionnalInfo: [additionnalInfoSchema]
});

module.exports = mongoose.model('Event', eventSchema);
