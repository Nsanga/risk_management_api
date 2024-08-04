const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const entitySchema = new Schema({
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
    default: false
  },
  owner: {
    type: String,
    required: true
  },
  nominee: {
    type: String,
    required: true
  },
  reviewer: {
    type: String,
    required: false
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
    required: true
  }
}, { timestamps: true });

const Entity = mongoose.model('Entity', entitySchema);

module.exports = Entity;
