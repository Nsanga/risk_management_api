const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userGroupSchema = new Schema({
  tenantId: { type: String, required: true },
  groupName: {
    type: String,
    required: true
  },
  roles: [{
    type: String,
    required: true
  }]
}, { timestamps: true });

const UserGroup = mongoose.model('UserGroup', userGroupSchema);

module.exports = UserGroup;
