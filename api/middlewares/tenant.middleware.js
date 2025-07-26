module.exports = function (req, res, next) {
    let tenantId;

    // 1. Essayer depuis header personnalisé
    if (req.headers["x-tenant-id"]) {
        tenantId = req.headers["x-tenant-id"];
    }

    // 2. Sinon, en mode dev, fallback
    else if (process.env.NODE_ENV === "development") {
        tenantId = "defaultTenant";
    }

    // 3. Si toujours rien : erreur
    if (!tenantId) {
        return res.status(400).json({ message: "Tenant ID manquant" });
    }

    req.tenantId = tenantId.toLowerCase();
    next();
};
