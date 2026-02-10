import api from './api';

const appointmentService = {
  // Obtenir tous les rendez-vous
  getAllAppointments: async (params = {}) => {
    try {
      const response = await api.get('/appointments', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des rendez-vous' };
    }
  },

  // Obtenir un rendez-vous par ID
  getAppointmentById: async (id) => {
    try {
      const response = await api.get(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération du rendez-vous' };
    }
  },

  // Créer un rendez-vous
  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la création du rendez-vous' };
    }
  },

  // Mettre à jour un rendez-vous
  updateAppointment: async (id, appointmentData) => {
    try {
      const response = await api.put(`/appointments/${id}`, appointmentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la mise à jour du rendez-vous' };
    }
  },

  // Annuler un rendez-vous
  cancelAppointment: async (id) => {
    try {
      const response = await api.delete(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de l\'annulation du rendez-vous' };
    }
  },

  // Obtenir les disponibilités d'un médecin
  getAvailability: async (medecin_id, date) => {
    try {
      const response = await api.get(`/appointments/availability/${medecin_id}`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des disponibilités' };
    }
  },

  // Obtenir les statistiques
  getStats: async () => {
    try {
      const response = await api.get('/appointments/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques' };
    }
  }
};

export default appointmentService;