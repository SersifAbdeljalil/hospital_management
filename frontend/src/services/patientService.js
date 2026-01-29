import api from './api';

const patientService = {
  // Obtenir tous les patients
  getAllPatients: async (params = {}) => {
    try {
      const response = await api.get('/patients', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des patients' };
    }
  },

  // Obtenir un patient par ID
  getPatientById: async (id) => {
    try {
      // ✅ CORRECTION: Template string correct
      const response = await api.get(`/patients/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération du patient' };
    }
  },

  // Créer un nouveau patient
  createPatient: async (data) => {
    try {
      const response = await api.post('/patients', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la création du patient' };
    }
  },

  // Mettre à jour un patient
  updatePatient: async (id, data) => {
    try {
      // ✅ CORRECTION: Template string correct
      const response = await api.put(`/patients/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la mise à jour du patient' };
    }
  },

  // Supprimer un patient
  deletePatient: async (id) => {
    try {
      // ✅ CORRECTION: Template string correct
      const response = await api.delete(`/patients/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la suppression du patient' };
    }
  },

  // Mettre à jour le dossier médical
  updateMedicalRecord: async (id, data) => {
    try {
      // ✅ CORRECTION: Template string correct
      const response = await api.put(`/patients/${id}/medical-record`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la mise à jour du dossier médical' };
    }
  },

  // Obtenir les statistiques
  getStats: async () => {
    try {
      const response = await api.get('/patients/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques' };
    }
  }
};

export default patientService;