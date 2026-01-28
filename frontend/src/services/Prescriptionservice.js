import api from './api';

const prescriptionService = {
  // ========== MÉDECIN ==========
  
  // Créer une ordonnance
  createPrescription: async (data) => {
    try {
      const response = await api.post('/prescriptions', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la création de l\'ordonnance' };
    }
  },

  // Obtenir toutes les ordonnances du médecin
  getDoctorPrescriptions: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.statut) params.append('statut', filters.statut);
      if (filters.patient_id) params.append('patient_id', filters.patient_id);
      if (filters.date_debut) params.append('date_debut', filters.date_debut);
      if (filters.date_fin) params.append('date_fin', filters.date_fin);
      
      // ✅ CORRECT: Parenthèses puis backticks À L'INTÉRIEUR
      const response = await api.get(`/prescriptions?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des ordonnances' };
    }
  },

  // Créer une facture pour une ordonnance
  createInvoice: async (prescriptionId, montant) => {
    try {
      // ✅ CORRECT: Parenthèses puis backticks À L'INTÉRIEUR
      const response = await api.post(`/prescriptions/${prescriptionId}/invoice`, { montant });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la création de la facture' };
    }
  },

  // Supprimer une ordonnance
  deletePrescription: async (id) => {
    try {
      // ✅ CORRECT: Parenthèses puis backticks À L'INTÉRIEUR
      const response = await api.delete(`/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la suppression de l\'ordonnance' };
    }
  },

  // ========== PATIENT ==========
  
  // Obtenir mes ordonnances (patient)
  getMyPrescriptions: async () => {
    try {
      const response = await api.get('/prescriptions/my-prescriptions');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération des ordonnances' };
    }
  },

  // ========== COMMUN ==========
  
  // Obtenir une ordonnance par ID
  getPrescriptionById: async (id) => {
    try {
      // ✅ CORRECT: Parenthèses puis backticks À L'INTÉRIEUR
      const response = await api.get(`/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la récupération de l\'ordonnance' };
    }
  },

  // Télécharger le PDF de l'ordonnance
  downloadPDF: async (id) => {
    try {
      // ✅ CORRECT: Parenthèses puis backticks À L'INTÉRIEUR
      const response = await api.get(`/prescriptions/${id}/pdf`, {
        responseType: 'blob'
      });
      
      // Créer un blob et télécharger le fichier
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ordonnance-${id}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors du téléchargement du PDF' };
    }
  },

  // ========== ADMIN / RÉCEPTIONNISTE ==========
  
  // Marquer une ordonnance comme payée
  markAsPaid: async (id) => {
    try {
      // ✅ CORRECT: Parenthèses puis backticks À L'INTÉRIEUR
      const response = await api.put(`/prescriptions/${id}/payment`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la mise à jour du paiement' };
    }
  }
};

export default prescriptionService;