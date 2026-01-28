const express = require('express');
const router = express.Router();
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  addPayment,
  deleteInvoice,
  getInvoiceStats,
  cancelInvoice
} = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Toutes les routes nécessitent une authentification
router.use(protect);

// Statistiques
router.get(
  '/stats',
  authorize('admin', 'receptionniste'),
  getInvoiceStats
);

// Annuler une facture
router.put(
  '/:id/cancel',
  authorize('admin'),
  cancelInvoice
);

// Ajouter un paiement
router.post(
  '/:id/payment',
  authorize('admin', 'receptionniste'),
  addPayment
);

// CRUD Factures
router.route('/')
  .get(authorize('admin', 'receptionniste', 'patient'), getAllInvoices)
  .post(authorize('admin', 'receptionniste'), createInvoice);

router.route('/:id')
  .get(authorize('admin', 'receptionniste', 'patient'), getInvoiceById)
  .put(authorize('admin', 'receptionniste'), updateInvoice)
  .delete(authorize('admin'), deleteInvoice);

module.exports = router;