import api from './api';

const authService = {
  // Inscription
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success && response.data.token) {
        // Stocker le token et les infos utilisateur
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de l\'inscription' };
    }
  },

  // Connexion
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.token) {
        // Stocker le token et les infos utilisateur
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la connexion' };
    }
  },

  // Déconnexion
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Supprimer les données locales
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Obtenir l'utilisateur connecté
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      
      if (response.data.success) {
        // Mettre à jour les infos utilisateur locales
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  },

  // Changer le mot de passe
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors du changement de mot de passe' };
    }
  },

  // ⭐⭐⭐ NOUVELLES MÉTHODES - RÉCUPÉRATION DE MOT DE PASSE ⭐⭐⭐
  
  // Demander la réinitialisation du mot de passe
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de l\'envoi de l\'email' };
    }
  },

  // Vérifier le code de réinitialisation
  verifyResetCode: async (email, code) => {
    try {
      const response = await api.post('/auth/verify-reset-code', { email, code });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Code invalide ou expiré' };
    }
  },

  // Réinitialiser le mot de passe
  resetPassword: async (email, code, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        code,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors de la réinitialisation du mot de passe' };
    }
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Obtenir le token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Obtenir les infos utilisateur depuis le localStorage
  getUserFromStorage: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
        return null;
      }
    }
    return null;
  }
};

export default authService;