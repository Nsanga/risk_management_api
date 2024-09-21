require('dotenv').config();
const express = require('express');
const appRoutes = require("../api/routes/index");
const bodyParser = require("body-parser");
const cors = require('cors');
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const dbConnect = require('../api/config/dbConnect');

// Connection à MongoDB
dbConnect();

// Initialisation de l'application
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware pour gérer les requêtes CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Routes de l'application
app.use('/.netlify/functions/api/v1', appRoutes());

// Gestion des erreurs
app.use((req, res, next) => {
    next(createError(404, 'Route not found'));
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        error: {
            status: err.status || 500,
            message: err.message || 'Internal Server Error',
        },
    });
});

// Exporter la fonction handler pour Netlify
exports.handler = async (event, context) => {
    return new Promise((resolve, reject) => {
        try {
            const req = Object.assign({}, event, { headers: event.headers });
            const res = {
                setHeader: (key, value) => {
                    res.headers[key] = value;
                },
                headers: {},
                status: (code) => {
                    res.statusCode = code;
                    return res;
                },
                json: (data) => {
                    res.body = JSON.stringify(data);
                    resolve({
                        statusCode: res.statusCode || 200,
                        body: res.body,
                        headers: res.headers,
                    });
                },
                send: (data) => {
                    res.body = data;
                    resolve({
                        statusCode: res.statusCode || 200,
                        body: res.body,
                        headers: res.headers,
                    });
                },
            };

            app(req, res);
        } catch (error) {
            reject({
                statusCode: 500,
                body: JSON.stringify({ message: 'Internal Server Error', error }),
            });
        }
    });
};
