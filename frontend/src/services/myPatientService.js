import api from './api';

const myPatientService = {
  // Obtenir tous mes patients
  getMyPatients: async (params = {}) => {
    try {
      const response = await api.get('/my-patients', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir un patient spécifique
  getMyPatientById: async (id) => {
    try {
      // ✅ CORRECT: Parenthèses puis backticks
      const response = await api.get(`/my-patients/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  }
};

export default myPatientService;