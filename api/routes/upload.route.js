const express = require('express');
const router = express.Router();
const uploadHandler = require('../controllers/upload.controller');
const multer = require('multer');
const upload = multer(); // Configure multer pour gérer les fichiers

const setupUpload = (app) => {
  app.use("/upload", router);

  router.post('/file', upload.single('file'), (req, res) => {
    uploadHandler.uploadFile(req, res);
  });

  router.post('/files', upload.array('files'), (req, res) => {
    uploadHandler.uploadMultipleFiles(req, res);
  });
};

module.exports = setupUpload;
