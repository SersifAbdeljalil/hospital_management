const { query } = require('../config/database');

// @desc    Obtenir toutes les notifications d'un utilisateur
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        n.*,
        u.nom as sender_nom,
        u.prenom as sender_prenom
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `;

    const notifications = await query(sql, [userId]);

    res.status(200).json({
      success: true,
      count: notifications ? notifications.length : 0,
      data: notifications || []
    });
  } catch (error) {
    console.error('Erreur getNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications',
      error: error.message
    });
  }
};

// @desc    Obtenir le nombre de notifications non lues
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    const count = result && result.length > 0 ? result[0].count : 0;

    res.status(200).json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Erreur getUnreadCount:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du nombre de notifications',
      count: 0,
      error: error.message
    });
  }
};

// @desc    Marquer une notification comme lue
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!notification || notification.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    await query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Notification marquée comme lue'
    });
  } catch (error) {
    console.error('Erreur markAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la notification',
      error: error.message
    });
  }
};

// @desc    Marquer toutes les notifications comme lues
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    });
  } catch (error) {
    console.error('Erreur markAllAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des notifications',
      error: error.message
    });
  }
};

// @desc    Supprimer une notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!notification || notification.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    await query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Notification supprimée'
    });
  } catch (error) {
    console.error('Erreur deleteNotification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la notification',
      error: error.message
    });
  }
};

// @desc    Créer une notification (fonction helper)
// @access  Private (internal use)
exports.createNotification = async (userId, type, title, message, relatedId = null, senderId = null) => {
  try {
    const sql = `
      INSERT INTO notifications (user_id, type, title, message, related_id, sender_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [userId, type, title, message, relatedId, senderId]);
    return result.insertId;
  } catch (error) {
    console.error('Erreur createNotification:', error);
    throw error;
  }
};