module.exports = function (req, res, next) {
    const host = req.hostname; // ecobank.app.com
    const subdomain = host.split('.')[0]; // "ecobank"
  
    if (!subdomain) {
      return res.status(400).json({ message: "Tenant not specified" });
    }
  
    req.body.tenantId = subdomain.toLowerCase();
    next();
  };
  