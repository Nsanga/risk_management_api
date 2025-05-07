<<<<<<< HEAD
=======

>>>>>>> 4729169 (Re-initialisation après suppression du .git)
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const entitySchema = new Schema({
<<<<<<< HEAD
=======
  referenceId: {
    type: String,
    unique: true,
  },
>>>>>>> 4729169 (Re-initialisation après suppression du .git)
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
