const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorStats,
  updateDoctorProfile,
  uploadProfilePhoto,
  deleteProfilePhoto
} = require('../controllers/doctorController');

router.use(protect);

// =====================================================
// ROUTES SPÉCIFIQUES - DOIVENT ÊTRE EN PREMIER
// =====================================================

// Statistiques - Admin uniquement
router.get('/stats', authorize('admin'), getDoctorStats);

// Photo de profil - IMPORTANT: Ces routes doivent être AVANT les routes /:id
router.post(
  '/profile/photo',
  authorize('medecin'),
  upload.single('photo'),
  uploadProfilePhoto
);

router.delete(
  '/profile/photo',
  authorize('medecin'),
  deleteProfilePhoto
);

router.put('/profile', authorize('medecin'), updateDoctorProfile);


router.get('/', getAllDoctors); 

router.post('/', authorize('admin'), createDoctor);


router.get('/:id', getDoctorById); 

router.put('/:id', authorize('admin'), updateDoctor);
router.delete('/:id', authorize('admin'), deleteDoctor);

module.exports = router;