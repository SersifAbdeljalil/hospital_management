import api from './api';

const dashboardService = {
  // Admin stats
  getAdminStats: async () => {
    try {
      const response = await api.get('/dashboard/admin/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques admin' };
    }
  },

  // Doctor stats
  getDoctorStats: async () => {
    try {
      const response = await api.get('/dashboard/doctor/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques médecin' };
    }
  },

  // Quick stats
  getQuickStats: async () => {
    try {
      const response = await api.get('/dashboard/quick-stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques rapides' };
    }
  }
};

export default dashboardService;