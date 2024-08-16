const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userProfileSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  jobTitle: {
    type: String,
  },
  location: {
    type: String,
  },
  telephone: {
    type: String,
  },
  email: {
    type: String,
    required: true
  },
  userGroup: {
    type: String,
    required: false
  },
  language: {
    type: String,
    required: false
  },
  ccEmailTo: {
    type: String,
    required: false
  },
  nominee: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: false,
    default: 'Pending'
  },
  activeUser: {
    type: Boolean,
    default: false 
  },
  administrator: {
    type: Boolean,
    default: false
  },
  passwordExpiryDate: {
    type: Date,
    required: false
  },
  lockedOutReason: {
    type: String,
    required: false
  },
  surname: {
    type: String,
  },
  role: {
    type: String,
    default: 'user'
  },
}, { timestamps: true });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
