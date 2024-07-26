const winston = require('winston');
const { format } = winston;
const fs = require('fs');
const path = require('path');
const { sendMessageToNumber } = require("../helpers/whatsApp/whatsappMessaging");

const logDirectory = './api/logging';

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Configuration du logger avec le transport personnalisé
const logger = (client) => winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    // Transport pour écrire dans un fichier
    new winston.transports.File({ 
      filename: path.join(logDirectory, 'logger.log'),
      maxsize: 5242880, 
      maxFiles: 5,
    }),
    // Transport pour afficher les logs dans la console
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // Transport personnalisé pour envoyer des messages WhatsApp
    new WhatsAppTransport({ client }),
  ]
});

module.exports = logger;