const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { 
  getPatientStats, 
  getPatientProfile 
} = require('../controllers/patientDashboardController');

// Toutes les routes sont protégées et réservées aux patients
router.use(protect);
router.use(authorize('patient'));

// @route   GET /api/dashboard/patient/stats
// @desc    Obtenir les statistiques du dashboard patient
// @access  Private (patient uniquement)
router.get('/stats', getPatientStats);

// @route   GET /api/dashboard/patient/profile
// @desc    Obtenir le profil complet du patient
// @access  Private (patient uniquement)
router.get('/profile', getPatientProfile);

module.exports = router;