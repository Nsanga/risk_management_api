const express = require('express');
const eventRoutes = require('./event.route');
const setupUpload = require('./upload.route');

const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'RiskManagement' });
});

const appRoutes = () => {
  const app = router;
  eventRoutes(app);
  setupUpload(app)
  return app;
};

module.exports = appRoutes;
