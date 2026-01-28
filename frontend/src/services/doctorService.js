import api from './api';

const doctorService = {
  // Obtenir tous les médecins
  getAllDoctors: async (params = {}) => {
    try {
      const response = await api.get('/doctors', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir un médecin par ID
  getDoctorById: async (id) => {
    try {
      const response = await api.get(`/doctors/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Créer un nouveau médecin
  createDoctor: async (data) => {
    try {
      const response = await api.post('/doctors', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Mettre à jour un médecin
  updateDoctor: async (id, data) => {
    try {
      const response = await api.put(`/doctors/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Supprimer un médecin
  deleteDoctor: async (id) => {
    try {
      const response = await api.delete(`/doctors/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir les statistiques
  getDoctorStats: async () => {
    try {
      const response = await api.get('/doctors/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Mettre à jour le profil (par le médecin lui-même)
  updateProfile: async (data) => {
    try {
      const response = await api.put('/doctors/profile', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  }
};

export default doctorService;