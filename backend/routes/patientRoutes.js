const express = require('express');
const router = express.Router();
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  updateMedicalRecord,
  getPatientStats
} = require('../controllers/patientController');

const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Routes publiques (protégées par authentification)
router.use(protect);

// Statistiques - Admin et Médecin
router.get(
  '/stats',
  authorize('admin', 'medecin'),
  getPatientStats
);

// CRUD Patients
router.route('/')
  .get(authorize('admin', 'medecin', 'infirmier', 'receptionniste'), getAllPatients)
  .post(authorize('admin', 'receptionniste'), createPatient);

router.route('/:id')
  .get(authorize('admin', 'medecin', 'infirmier', 'receptionniste', 'patient'), getPatientById)
  .put(authorize('admin', 'receptionniste'), updatePatient)
  .delete(authorize('admin'), deletePatient);

// Dossier médical
router.put(
  '/:id/medical-record',
  authorize('admin', 'medecin', 'infirmier'),
  updateMedicalRecord
);

module.exports = router;