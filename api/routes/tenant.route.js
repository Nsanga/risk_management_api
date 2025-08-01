var express = require('express');
var router = express.Router();
const tenantController = require("../controllers/tenant.controller");
const multer = require("multer");

// 🔸 Multer en mémoire uniquement pour Cloudinary
const upload = multer({ dest: "temp/" }); // stocke temporairement

const tenantRoute = app => {
  app.use("/tenant", router);

  router.post("/", upload.single("logo"), tenantController.createTenant);

  // 🔹 Obtenir tous les tenants
  router.get("/", tenantController.getAllTenants);
  
  // 🔹 Obtenir un tenant par ID
  router.get("/:id", tenantController.getTenantById);

  // 🔹 Obtenir un tenant par tenantId
  router.get('/tenant-by-tenant-id/:tenantId', tenantController.getTenantByTenantId);
  
  // 🔹 Mettre à jour un tenant
  router.put("/:id", upload.single("logo"), tenantController.updateTenant);
  
  // 🔹 Supprimer un tenant
  router.delete("/:id", tenantController.deleteTenant);
}

module.exports = tenantRoute;
