const express = require('express');
const router = express.Router();
const {
  getAllConsultations,
  getConsultationById,
  createConsultation,
  updateConsultation,
  terminerConsultation,
  deleteConsultation,
  getConsultationStats,
  getPatientConsultationHistory
} = require('../controllers/consultationController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Statistiques
router.get(
  '/stats',
  authorize('admin', 'medecin'),
  getConsultationStats
);

// Historique patient
router.get(
  '/patient/:patientId/historique',
  authorize('admin', 'medecin', 'infirmier', 'patient'),
  getPatientConsultationHistory
);

// Terminer une consultation
router.put(
  '/:id/terminer',
  authorize('medecin'),
  terminerConsultation
);

// CRUD Consultations
router.route('/')
  .get(authorize('admin', 'medecin', 'infirmier', 'patient'), getAllConsultations)
  .post(authorize('medecin', 'infirmier'), createConsultation);

router.route('/:id')
  .get(authorize('admin', 'medecin', 'infirmier', 'patient'), getConsultationById)
  .put(authorize('medecin', 'infirmier'), updateConsultation)
  .delete(authorize('admin'), deleteConsultation);

module.exports = router;