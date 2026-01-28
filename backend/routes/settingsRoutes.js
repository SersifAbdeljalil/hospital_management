const express = require('express');
const router = express.Router();
const {
  getAllSettings,
  getSettingByKey,
  upsertSetting,
  bulkUpdateSettings,
  deleteSetting,
  initializeDefaultSettings
} = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Toutes les routes nécessitent une authentification admin
router.use(protect);
router.use(authorize('admin'));

// Initialiser les paramètres par défaut
router.post('/initialize', initializeDefaultSettings);

// Mise à jour en masse
router.put('/bulk', bulkUpdateSettings);

// CRUD Paramètres
router.route('/')
  .get(getAllSettings)
  .post(upsertSetting);

router.route('/:cle')
  .get(getSettingByKey)
  .delete(deleteSetting);

module.exports = router;