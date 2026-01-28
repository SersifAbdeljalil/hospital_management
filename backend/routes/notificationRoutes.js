const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware'); // ✅ CORRIGÉ : middlewares avec un 's'
const notificationController = require('../controllers/notificationController');

// Toutes les routes sont protégées
router.use(protect);

// @route   GET /api/notifications
// @desc    Obtenir toutes les notifications de l'utilisateur
// @access  Private
router.get('/', notificationController.getNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Obtenir le nombre de notifications non lues
// @access  Private
router.get('/unread-count', notificationController.getUnreadCount);

// @route   PUT /api/notifications/:id/read
// @desc    Marquer une notification comme lue
// @access  Private
router.put('/:id/read', notificationController.markAsRead);

// @route   PUT /api/notifications/mark-all-read
// @desc    Marquer toutes les notifications comme lues
// @access  Private
router.put('/mark-all-read', notificationController.markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Supprimer une notification
// @access  Private
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;