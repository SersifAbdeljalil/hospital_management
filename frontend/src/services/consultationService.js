import api from './api';

const consultationService = {
  // Obtenir toutes les consultations
  getAllConsultations: async (params = {}) => {
    try {
      const response = await api.get('/consultations', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir une consultation par ID
  getConsultationById: async (id) => {
    try {
      const response = await api.get(`/consultations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Créer une nouvelle consultation
  createConsultation: async (data) => {
    try {
      const response = await api.post('/consultations', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Mettre à jour une consultation
  updateConsultation: async (id, data) => {
    try {
      const response = await api.put(`/consultations/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Terminer une consultation
  terminerConsultation: async (id) => {
    try {
      const response = await api.put(`/consultations/${id}/terminer`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Supprimer une consultation
  deleteConsultation: async (id) => {
    try {
      const response = await api.delete(`/consultations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir les statistiques
  getConsultationStats: async () => {
    try {
      const response = await api.get('/consultations/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir l'historique d'un patient
  getPatientHistory: async (patientId) => {
    try {
      const response = await api.get(`/consultations/patient/${patientId}/historique`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  }
};

export default consultationService;