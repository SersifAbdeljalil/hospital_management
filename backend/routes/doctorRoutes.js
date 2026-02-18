const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
// Importer le middleware upload
const upload = require('../middlewares/uploadMiddleware');

// Importer toutes les fonctions du controller
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

// Toutes les routes nécessitent une authentification
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

// Profil du médecin (mise à jour par le médecin lui-même)
router.put('/profile', authorize('medecin'), updateDoctorProfile);


router.get('/', getAllDoctors); // Pas de authorize ici - accessible à tous les utilisateurs authentifiés !

// Création réservée à l'admin
router.post('/', authorize('admin'), createDoctor);


router.get('/:id', getDoctorById); 

router.put('/:id', authorize('admin'), updateDoctor);
router.delete('/:id', authorize('admin'), deleteDoctor);

module.exports = router;