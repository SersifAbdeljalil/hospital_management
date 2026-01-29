import api from './api';

const patientDashboardService = {
  // Obtenir les statistiques du dashboard patient
  getPatientStats: async () => {
    try {
      const response = await api.get('/dashboard/patient/stats');
      return response.data;
    } catch (error) {
      console.error('Erreur getPatientStats:', error);
      throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques' };
    }
  },

  // Obtenir le profil complet du patient
  getPatientProfile: async () => {
    try {
      const response = await api.get('/dashboard/patient/profile');
      return response.data;
    } catch (error) {
      console.error('Erreur getPatientProfile:', error);
      throw error.response?.data || { message: 'Erreur lors de la récupération du profil' };
    }
  }
};

export default patientDashboardService;