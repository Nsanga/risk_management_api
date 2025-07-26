const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
  name: String,
  tenantId: { type: String, unique: true },
  primaryColor: String,
  logo: String,
  features: Object,
  sidebarMenus: Object,
  isDeleted: { type: Boolean, default: false }
});

module.exports = mongoose.model("Tenant", tenantSchema);
