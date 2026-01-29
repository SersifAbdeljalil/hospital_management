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
  },

  // Télécharger le PDF
  downloadAppointmentPDF: async (id) => {
    try {
      const response = await api.get(`/my-appointments/${id}/pdf`, {
        responseType: 'blob'
      });
      
      // Créer un URL temporaire pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Créer un élément <a> pour télécharger
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RDV-${id}-${Date.now()}.pdf`);
      
      // Déclencher le téléchargement
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors du téléchargement du PDF' };
    }
  }
};

export default myAppointmentService;