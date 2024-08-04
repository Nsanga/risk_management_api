const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userProfileSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  telephone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  userGroup: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true
  },
  ccEmailTo: {
    type: String,
    required: true
  },
  nominee: {
    type: String,
    required: true
  },
  activeUser: {
    type: Boolean,
    default: true
  },
  passwordExpiryDate: {
    type: Date,
    required: true
  },
  lockedOutReason: {
    type: String,
    required: false
  }
}, { timestamps: true });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
