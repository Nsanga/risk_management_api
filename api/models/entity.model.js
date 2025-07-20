
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const entitySchema = new Schema({
  tenantId: { type: String},
  referenceId: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
    required: true
  },
  ram: {
    type: String,
    required: false
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  entityActive: {
    type: Boolean,
    default: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'UserProfile',
    required: true
  },
  nominee: {
    type: Schema.Types.ObjectId,
    ref: 'UserProfile',
    required: false,
    default: null
  },
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'UserProfile',
    required: false,
    default: null
  },
  reviewDate: {
    type: Date,
    required: false
  },
  location: {
    type: String,
    required: true
  },
  businessLine: { 
    type: String,
    required: false 
  }, 
}, { timestamps: true });

const Entity = mongoose.model('Entity', entitySchema);

module.exports = Entity;
