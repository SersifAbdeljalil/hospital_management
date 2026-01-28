const express = require('express');
const router = express.Router();
const {
  getMyAppointments,
  getMyAppointmentById,
  updateAppointmentStatus,
  addAppointmentNotes
} = require('../controllers/myAppointmentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Toutes les routes nécessitent une authentification médecin
router.use(protect);
router.use(authorize('medecin'));

// Mes rendez-vous
router.get('/', getMyAppointments);
router.get('/:id', getMyAppointmentById);
router.put('/:id/status', updateAppointmentStatus);
router.put('/:id/notes', addAppointmentNotes);

module.exports = router;