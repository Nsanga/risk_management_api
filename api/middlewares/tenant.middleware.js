module.exports = function (req, res, next) {
    let tenantId;
  
    // Autoriser toutes les routes commençant par /tenant sans x-tenant-id
    const isTenantRoute = req.path.startsWith("/tenant");
  
    if (isTenantRoute) {
      return next(); // ✅ Bypass : pas besoin de tenantId pour les routes /tenant
    }
  
    // Pour toutes les autres routes, on exige un tenantId dans le header
    if (req.headers["x-tenant-id"]) {
      tenantId = req.headers["x-tenant-id"];
    } else if (process.env.NODE_ENV === "development") {
      tenantId = "defaultTenant";
    } else {
      return res.status(400).json({ message: "Tenant ID manquant" });
    }
  
    req.tenantId = tenantId.toLowerCase();
    next();
  };
  