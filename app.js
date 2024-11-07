require('dotenv').config();
const express = require('express');
const appRoutes = require("./api/routes/index");
const bodyParser = require("body-parser");
const cors = require('cors');
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const dbConnect = require('./api/config/dbConnect');
const http = require('http');

// Connection to MongoDB
dbConnect();

// App initialization
const app = express();

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware to handle CORS requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

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
server.listen(4500, () => {
  console.log("Server started on port 4500");
});
