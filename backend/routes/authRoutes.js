const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// ========== ROUTES PUBLIQUES ==========

// Inscription
router.post('/register', authController.register);

// Connexion
router.post('/login', authController.login);

// Réinitialisation du mot de passe avec code de vérification
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);

// ========== ROUTES PROTÉGÉES ==========

// Profil utilisateur
router.get('/me', protect, authController.getMe);

// Déconnexion
router.post('/logout', protect, authController.logout);

// Changer le mot de passe
router.put('/change-password', protect, authController.changePassword);

module.exports = router;