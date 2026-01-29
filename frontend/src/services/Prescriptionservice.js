import api from './api';

const prescriptionService = {
  // Créer une ordonnance
  createPrescription: async (data) => {
    try {
      const response = await api.post('/prescriptions', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir toutes les ordonnances du médecin
  getDoctorPrescriptions: async (params = {}) => {
    try {
      const response = await api.get('/prescriptions', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir une ordonnance par ID
  getPrescriptionById: async (id) => {
    try {
      const response = await api.get(`/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Obtenir mes ordonnances (patient)
  getMyPrescriptions: async (params = {}) => {
    try {
      const response = await api.get('/prescriptions/my-prescriptions', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // Télécharger le PDF
  downloadPDF: async (id) => {
    try {
      const response = await api.get(`/prescriptions/${id}/pdf`, {
        responseType: 'blob'
      });
      
      // Créer un URL temporaire pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Créer un élément <a> pour télécharger
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ordonnance-${id}-${Date.now()}.pdf`);
      
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
  },

  // Créer une facture pour une ordonnance
  createInvoice: async (id, montant) => {
    try {
      const response = await api.post(`/prescriptions/${id}/invoice`, { montant });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  },

  // ⭐⭐⭐ PAYER UNE ORDONNANCE ⭐⭐⭐
  payPrescription: async (id, paymentData) => {
    try {
      const response = await api.post(`/prescriptions/${id}/pay`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors du paiement' };
    }
  },

  // Supprimer une ordonnance
  deletePrescription: async (id) => {
    try {
      const response = await api.delete(`/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur réseau' };
    }
  }
};

export default prescriptionService;