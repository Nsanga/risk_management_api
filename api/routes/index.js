const express = require('express');
const eventRoutes = require('./event.route');
const setupUpload = require('./upload.route');
const {setupUserRoutes} = require('./user.route');
const entityRoutes = require('./entity.route');
const profileRoutes = require('./userprofile.route');
const userGroupRoutes = require('./userGroup.route');
const riskControlRoutes = require('./riskControl.route');

const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'RiskManagement' });
});

const appRoutes = () => {
  const app = router;
  eventRoutes(app);
  setupUpload(app);
  setupUserRoutes(app);
  entityRoutes(app)
  profileRoutes(app)
  userGroupRoutes(app);
  riskControlRoutes(app);
  return app; 
};

module.exports = appRoutes;
