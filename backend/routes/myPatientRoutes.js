const express = require('express');
const router = express.Router();
const {
  getMyPatients,
  getMyPatientById
} = require('../controllers/myPatientController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect);
router.use(authorize('medecin'));

router.get('/', getMyPatients);
router.get('/:id', getMyPatientById);

module.exports = router;