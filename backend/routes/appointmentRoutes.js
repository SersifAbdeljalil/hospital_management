const express = require('express');
const router = express.Router();
const {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAvailability,
  getAppointmentStats
} = require('../controllers/appointmentController');

const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Statistiques
router.get('/stats', authorize('admin', 'medecin'), getAppointmentStats);

// Disponibilités d'un médecin
router.get('/availability/:medecin_id', getAvailability);

// CRUD Rendez-vous
router.route('/')
  .get(getAllAppointments)
  .post(createAppointment);

router.route('/:id')
  .get(getAppointmentById)
  .put(updateAppointment)
  .delete(cancelAppointment);

module.exports = router;