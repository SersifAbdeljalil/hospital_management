import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configuration axios avec token
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Obtenir toutes les notifications
const getNotifications = async () => {
  try {
    const response = await axios.get(`${API_URL}/notifications`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Obtenir le nombre de notifications non lues
const getUnreadCount = async () => {
  try {
    const response = await axios.get(`${API_URL}/notifications/unread-count`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Marquer une notification comme lue
const markAsRead = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/notifications/${id}/read`, {}, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Marquer toutes les notifications comme lues
const markAllAsRead = async () => {
  try {
    const response = await axios.put(`${API_URL}/notifications/mark-all-read`, {}, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Supprimer une notification
const deleteNotification = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/notifications/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const notificationService = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};

export default notificationService;