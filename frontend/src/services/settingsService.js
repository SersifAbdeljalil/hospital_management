import api from './api';

const settingsService = {
  // Obtenir tous les paramètres
  getAllSettings: async (params = {}) => {
    try {
      const response = await api.get('/settings', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir un paramètre par clé
  getSettingByKey: async (cle) => {
    try {
      const response = await api.get(`/settings/${cle}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Créer ou mettre à jour un paramètre
  upsertSetting: async (data) => {
    try {
      const response = await api.post('/settings', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Mise à jour en masse
  bulkUpdate: async (settings) => {
    try {
      const response = await api.put('/settings/bulk', { settings });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Supprimer un paramètre
  deleteSetting: async (cle) => {
    try {
      const response = await api.delete(`/settings/${cle}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Initialiser les paramètres par défaut
  initializeDefaults: async () => {
    try {
      const response = await api.post('/settings/initialize');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  }
};

export default settingsService;