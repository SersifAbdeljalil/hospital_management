import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

// Créer le contexte
export const AuthContext = createContext();

// Provider du contexte
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Charger l'utilisateur au montage du composant
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Vérifier si un token existe
        if (authService.isAuthenticated()) {
          // Récupérer l'utilisateur depuis le localStorage
          const storedUser = authService.getUserFromStorage();
          
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
            
            // Optionnel : Rafraîchir les données depuis le serveur
            try {
              const freshUser = await authService.getCurrentUser();
              if (freshUser) {
                // Mettre à jour l'utilisateur avec les données fraîches du serveur
                setUser(freshUser);
                // Sauvegarder dans localStorage
                localStorage.setItem('user', JSON.stringify(freshUser));
              }
            } catch (error) {
              console.error('Erreur lors du rafraîchissement du profil:', error);
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      console.log('Réponse login:', response); // DEBUG
      
      if (response.success) {
        // S'assurer que l'utilisateur a bien un rôle
        const userWithRole = response.user;
        
        console.log('Utilisateur connecté:', userWithRole); // DEBUG
        
        setUser(userWithRole);
        setIsAuthenticated(true);
        
        // Sauvegarder dans localStorage
        localStorage.setItem('user', JSON.stringify(userWithRole));
        
        return { 
          success: true, 
          user: userWithRole 
        };
      }
      
      return { 
        success: false, 
        message: response.message || 'Email ou mot de passe incorrect' 
      };
    } catch (error) {
      console.error('Erreur dans AuthContext.login:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur lors de la connexion' 
      };
    }
  };

  // Fonction d'inscription
  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Sauvegarder dans localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        
        return { success: true, user: response.user };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Erreur lors de l\'inscription' 
      };
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Nettoyer le localStorage
    localStorage.removeItem('user');
  };

  // Fonction pour mettre à jour l'utilisateur
  const updateUser = (userData) => {
    setUser(userData);
    // IMPORTANT : Toujours sauvegarder dans localStorage
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Fonction pour rafraîchir l'utilisateur
  const refreshUser = async () => {
    try {
      const freshUser = await authService.getCurrentUser();
      if (freshUser) {
        setUser(freshUser);
        // Sauvegarder dans localStorage
        localStorage.setItem('user', JSON.stringify(freshUser));
        return freshUser;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};