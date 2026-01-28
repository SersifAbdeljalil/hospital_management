const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorStats,
  updateDoctorProfile
} = require('../controllers/doctorController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Statistiques - Admin uniquement
router.get(
  '/stats',
  authorize('admin'),
  getDoctorStats
);

// Profil du médecin (mise à jour par le médecin lui-même)
router.put(
  '/profile',
  authorize('medecin'),
  updateDoctorProfile
);

// CRUD Médecins
router.route('/')
  .get(authorize('admin', 'receptionniste'), getAllDoctors)
  .post(authorize('admin'), createDoctor);

router.route('/:id')
  .get(authorize('admin', 'receptionniste', 'medecin'), getDoctorById)
  .put(authorize('admin'), updateDoctor)
  .delete(authorize('admin'), deleteDoctor);

module.exports = router;