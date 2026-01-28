import api from './api';

const patientService = {
  // Obtenir tous les patients
  getAllPatients: async (params = {}) => {
    try {
      const { search = '', page = 1, limit = 10 } = params;
      const response = await api.get('/patients', {
        params: { search, page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des patients' };
    }
  },

  // Obtenir un patient par ID
  getPatientById: async (id) => {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération du patient' };
    }
  },

  // Créer un patient
  createPatient: async (patientData) => {
    try {
      const response = await api.post('/patients', patientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la création du patient' };
    }
  },

  // Mettre à jour un patient
  updatePatient: async (id, patientData) => {
    try {
      const response = await api.put(`/patients/${id}`, patientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la mise à jour du patient' };
    }
  },

  // Supprimer un patient
  deletePatient: async (id) => {
    try {
      const response = await api.delete(`/patients/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la suppression du patient' };
    }
  },

  // Mettre à jour le dossier médical
  updateMedicalRecord: async (id, medicalData) => {
    try {
      const response = await api.put(`/patients/${id}/medical-record`, medicalData);
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