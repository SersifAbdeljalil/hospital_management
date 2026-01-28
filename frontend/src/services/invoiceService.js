import api from './api';

const invoiceService = {
  // Obtenir toutes les factures
  getAllInvoices: async (params = {}) => {
    try {
      const response = await api.get('/invoices', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir une facture par ID
  getInvoiceById: async (id) => {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Créer une nouvelle facture
  createInvoice: async (data) => {
    try {
      const response = await api.post('/invoices', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Mettre à jour une facture
  updateInvoice: async (id, data) => {
    try {
      const response = await api.put(`/invoices/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Ajouter un paiement
  addPayment: async (id, data) => {
    try {
      const response = await api.post(`/invoices/${id}/payment`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Annuler une facture
  cancelInvoice: async (id) => {
    try {
      const response = await api.put(`/invoices/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Supprimer une facture
  deleteInvoice: async (id) => {
    try {
      const response = await api.delete(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir les statistiques
  getInvoiceStats: async () => {
    try {
      const response = await api.get('/invoices/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  }
};

export default invoiceService;