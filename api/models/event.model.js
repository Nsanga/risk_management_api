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
        recorded_by: String,
        recorded_date: Date,
        rate: String,
        total_currencies: String,
        increment_currency: String,
        total_losses: String,
        description: String,
        descriptionDetailled: String,
        cause: String,
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'UserProfile',
            required: true
        },
        nominee: {
            type: Schema.Types.ObjectId,
            ref: 'UserProfile',
            required: true,
        },
        reviewer: {  
            type: Schema.Types.ObjectId,
            ref: 'UserProfile',
            required: false,
            default: null
        },
        reviewer_date: Date,
        title: String,
        activeEvent: Boolean,
        excludeFundLosses: Boolean,
        notify: Boolean,
        externalEvent: Boolean,
        externalRef: String,
        entityOfDetection: {
            type: Schema.Types.ObjectId, 
            ref: 'Entity',
            required: true
        },
        subentityOfDetection: String,
        entityOfOrigin: {
            type: Schema.Types.ObjectId,
            ref: 'Entity',
            required: true
        },
        subentityOfOrigin: String,
        RAG: String,
        targetClosureDate: String,
        document: [String] // To handle both single URL and array of URLs
    },
    commentary: {
        comment: String
    },
    financials: [financialsSchema],
    additionnalInfo: [additionnalInfoSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    approved: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Event', eventSchema);
