import api from './api';

const myAppointmentService = {
  // Obtenir tous mes rendez-vous
  getMyAppointments: async (params = {}) => {
    try {
      const response = await api.get('/my-appointments', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir un rendez-vous spécifique
  getMyAppointmentById: async (id) => {
    try {
      const response = await api.get(`/my-appointments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Mettre à jour le statut
  updateAppointmentStatus: async (id, statut) => {
    try {
      const response = await api.put(`/my-appointments/${id}/status`, { statut });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Ajouter des notes
  addAppointmentNotes: async (id, notes) => {
    try {
      const response = await api.put(`/my-appointments/${id}/notes`, { notes });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  }
};

export default myAppointmentService;