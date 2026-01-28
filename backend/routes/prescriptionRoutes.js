const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getDoctorPrescriptions,
  getMyPrescriptions,
  getPrescriptionById,
  downloadPrescriptionPDF,
  createPrescriptionInvoice,
  updatePrescriptionPayment,
  deletePrescription
} = require('../controllers/prescriptionController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Routes pour les patients
router.get('/my-prescriptions', protect, authorize('patient'), getMyPrescriptions);

// Routes pour les médecins
router.get('/', protect, authorize('medecin'), getDoctorPrescriptions);
router.post('/', protect, authorize('medecin'), createPrescription);
router.delete('/:id', protect, authorize('medecin'), deletePrescription);
router.post('/:id/invoice', protect, authorize('medecin'), createPrescriptionInvoice);

// Routes partagées (médecin + patient)
router.get('/:id', protect, authorize('medecin', 'patient'), getPrescriptionById);
router.get('/:id/pdf', protect, authorize('medecin', 'patient'), downloadPrescriptionPDF);

// Routes pour admin/réceptionniste (gestion des paiements)
router.put('/:id/payment', protect, authorize('admin', 'receptionniste'), updatePrescriptionPayment);

module.exports = router;