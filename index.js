require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const dbConnect = require('./api/config/dbConnect');
const http = require('http');
const cors = require('cors');
const tenantMiddleware = require('./api/middlewares/tenant.middleware');

const app = express();
dbConnect(); // Connexion MongoDB

// Middlewares généraux
app.use(cors('*'));
app.use(bodyParser.json({ limit: '1mb', type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Headers CORS personnalisés
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-tenant-id");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
  next();
});

// 1️⃣ Charger les routes tenant SANS middleware
const tenantRoute = require("./api/routes/tenant.route");
tenantRoute(app); // Charge les routes : /api/v1/tenant/***

// 2️⃣ Charger les autres routes AVEC middleware tenant
const appRoutes = require("./api/routes/index"); // Cela inclut toutes les autres routes
app.use('/api/v1', tenantMiddleware, appRoutes());

// 404 handler
app.use((req, res, next) => {
  next(createError(404, 'Route not found'));
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      status: err.status || 500,
      message: err.message || 'Internal Server Error',
    },
  });
});

// Lancement du serveur
const server = http.createServer(app);
const PORT = process.env.PORT || 4500;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
