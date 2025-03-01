require('dotenv').config();
const express = require('express');
const appRoutes = require("./api/routes/index");
const bodyParser = require("body-parser");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const dbConnect = require('./api/config/dbConnect');
const http = require('http');
const cors = require('cors');

// Connection to MongoDB
dbConnect();

// App initialization
const app = express();

// CORS Configuration
// const corsOptions = {
//   origin: '*', // Tu peux restreindre à un domaine spécifique si nécessaire
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true // si tu utilises des cookies ou des headers d'authentification
// };
// app.use(cors(corsOptions));

app.use(cors('*'));
app.use(bodyParser.json({ limit: '1mb', type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
    next();
});


// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Preflight handling (OPTIONS requests)
// app.options('*', (req, res) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.sendStatus(204); // Recommandé pour les preflight
// });

// App Routes
app.use('/api/v1', appRoutes());

// Custom 404 error handler
app.use((req, res, next) => {
  next(createError(404, 'Route not found'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      status: err.status || 500,
      message: err.message || 'Internal Server Error',
    },
  });
});

// Create the HTTP server using the Express app
const server = http.createServer(app);

// Start the server on port 4500
const PORT = process.env.PORT || 4500;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
