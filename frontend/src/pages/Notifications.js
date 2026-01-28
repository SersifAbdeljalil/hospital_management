import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import notificationService from '../services/notificationservice';
import {
  MdNotifications,
  MdNotificationsActive,
  MdNotificationsNone,
  MdDelete,
  MdDoneAll,
  MdClose,
  MdCalendarToday,
  MdCheckCircle,
  MdCancel,
  MdInfo
} from 'react-icons/md';
import './Notifications.css';

const Notifications = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Fetch notifications périodiquement
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Toutes les 30 secondes
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Erreur fetchNotifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error('Erreur fetchUnreadCount:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await notificationService.markAsRead(id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, is_read: true } : notif
          )
        );
        fetchUnreadCount();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        toast.success('Toutes les notifications marquées comme lues');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await notificationService.deleteNotification(id);
      if (response.success) {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
        fetchUnreadCount();
        toast.success('Notification supprimée');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      appointment_created: <MdCalendarToday />,
      appointment_updated: <MdCalendarToday />,
      appointment_cancelled: <MdCancel />,
      appointment_reminder: <MdNotificationsActive />,
      consultation_created: <MdCheckCircle />,
      payment_received: <MdCheckCircle />,
      message: <MdInfo />
    };
    return icons[type] || <MdNotifications />;
  };

  const getNotificationColor = (type) => {
    const colors = {
      appointment_created: '#4CAF50',
      appointment_updated: '#2196F3',
      appointment_cancelled: '#F44336',
      appointment_reminder: '#FF9800',
      consultation_created: '#9C27B0',
      payment_received: '#4CAF50',
      message: '#2196F3'
    };
    return colors[type] || '#757575';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notifications-overlay" onClick={onClose} />
      <div className="notifications-panel">
        {/* Header */}
        <div className="notifications-header">
          <div className="header-title">
            <MdNotifications />
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <div className="header-actions">
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                className="btn-icon"
                onClick={handleMarkAllAsRead}
                title="Tout marquer comme lu"
              >
                <MdDoneAll />
              </button>
            )}
            <button
              className="btn-icon"
              onClick={onClose}
              title="Fermer"
            >
              <MdClose />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="notifications-body">
          {loading ? (
            <div className="notifications-loading">
              <div className="spinner"></div>
              <p>Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">
              <MdNotificationsNone className="empty-icon" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div
                    className="notification-icon"
                    style={{ backgroundColor: getNotificationColor(notification.type) }}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="notification-content">
                    <h3 className="notification-title">{notification.title}</h3>
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-time">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>

                  <button
                    className="notification-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    title="Supprimer"
                  >
                    <MdDelete />
                  </button>

                  {!notification.is_read && (
                    <div className="unread-indicator"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;