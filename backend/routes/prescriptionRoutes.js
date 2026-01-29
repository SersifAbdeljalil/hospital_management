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
  deletePrescription,
  payPrescription  // ← Importation ajoutée
} = require('../controllers/prescriptionController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// ⭐ Routes pour les patients (doivent être en PREMIER)
router.get('/my-prescriptions', protect, authorize('patient'), getMyPrescriptions);

// ⭐ Routes pour les médecins
router.get('/', protect, authorize('medecin'), getDoctorPrescriptions);
router.post('/', protect, authorize('medecin'), createPrescription);

// ⭐⭐⭐ ROUTES SPÉCIFIQUES (AVANT les routes avec :id) ⭐⭐⭐
router.post('/:id/invoice', protect, authorize('medecin'), createPrescriptionInvoice);
router.post('/:id/pay', protect, authorize('patient'), payPrescription);  // ← Route de paiement
router.put('/:id/payment', protect, authorize('admin', 'receptionniste'), updatePrescriptionPayment);
router.get('/:id/pdf', protect, authorize('medecin', 'patient'), downloadPrescriptionPDF);

// ⭐ Routes génériques avec :id (APRÈS les routes spécifiques)
router.get('/:id', protect, authorize('medecin', 'patient'), getPrescriptionById);
router.delete('/:id', protect, authorize('medecin'), deletePrescription);

module.exports = router;