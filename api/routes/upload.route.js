const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // Configure multer to handle file uploads
const uploadHandler = require('../controllers/upload.controller');

const setupUpload = (app) => {
  app.use("/upload", router);

  router.post('/files', upload.array('files'), uploadHandler.uploadFiles);
};

module.exports = setupUpload;
