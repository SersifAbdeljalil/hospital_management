const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getDoctorStats,
  getQuickStats
} = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Statistiques admin
router.get('/admin/stats', authorize('admin'), getAdminStats);

// Statistiques médecin
router.get('/doctor/stats', authorize('medecin'), getDoctorStats);

// Statistiques rapides (tous les rôles)
router.get('/quick-stats', getQuickStats);

module.exports = router;