import api from './api';

const patientService = {
  // Obtenir statistiques dashboard patient
  getStats: async () => {
    try {
      const response = await api.get('/patient-dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des statistiques' };
    }
  },

  // Obtenir profil patient complet
  getProfile: async () => {
    try {
      const response = await api.get('/patient-dashboard/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération du profil' };
    }
  },

  // Obtenir toutes mes ordonnances
  getMyPrescriptions: async (params = {}) => {
    try {
      const response = await api.get('/my-prescriptions', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des ordonnances' };
    }
  },

  // Obtenir détails d'une ordonnance
  getPrescriptionById: async (id) => {
    try {
      const response = await api.get(`/my-prescriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération de l\'ordonnance' };
    }
  },

  // Payer une ordonnance
  payPrescription: async (id, paymentData) => {
    try {
      const response = await api.post(`/my-prescriptions/${id}/pay`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors du paiement' };
    }
  },

  // Télécharger une ordonnance
  downloadPrescription: async (id) => {
    try {
      const response = await api.get(`/my-prescriptions/${id}/download`, {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ordonnance_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true, message: 'Téléchargement réussi' };
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors du téléchargement' };
    }
  },

  // Obtenir mes rendez-vous
  getMyAppointments: async (params = {}) => {
    try {
      const response = await api.get('/appointments', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des rendez-vous' };
    }
  },

  // Annuler un rendez-vous
  cancelAppointment: async (id) => {
    try {
      const response = await api.delete(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de l\'annulation' };
    }
  },

  // Obtenir mes consultations
  getMyConsultations: async (params = {}) => {
    try {
      const response = await api.get('/consultations', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des consultations' };
    }
  },

  // Obtenir mes factures
  getMyInvoices: async (params = {}) => {
    try {
      const response = await api.get('/invoices', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des factures' };
    }
  }
};

export default patientService;