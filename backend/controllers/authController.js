// ============================================
// CONTRÔLEUR AUTHENTIFICATION
// Gestion de l'authentification des utilisateurs
// ============================================

const User = require('../models/User');
const {
  generateTokenPair,
  verifyToken,
  validatePasswordStrength,
  validateEmail
} = require('../config/auth');

// ========== INSCRIPTION ==========
const register = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      password,
      confirmPassword,
      role,
      telephone,
      adresse,
      date_naissance,
      sexe,
      specialite,
      numero_licence
    } = req.body;

    // 1. Validation des champs obligatoires
    if (!nom || !prenom || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // 2. Validation de l'email
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // 3. Validation du mot de passe
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe trop faible',
        errors: passwordValidation.errors
      });
    }

    // 4. Validation du rôle
    const allowedRoles = ['admin', 'medecin', 'infirmier', 'receptionniste', 'patient'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    // 5. Vérifier si l'email existe déjà
    const userModel = new User(req.db);
    const existingUser = await userModel.findByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // 6. Créer l'utilisateur
    const userId = await userModel.create({
      nom,
      prenom,
      email,
      password,
      role,
      telephone,
      adresse,
      date_naissance,
      sexe,
      specialite,
      numero_licence
    });

    // 7. Récupérer l'utilisateur créé
    const newUser = await userModel.findById(userId);

    // 8. Générer les tokens
    const tokens = generateTokenPair(newUser);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: {
          id: newUser.id,
          nom: newUser.nom,
          prenom: newUser.prenom,
          email: newUser.email,
          role: newUser.role
        },
        ...tokens
      }
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
};

// ========== CONNEXION ==========
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation des champs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // 2. Rechercher l'utilisateur
    const userModel = new User(req.db);
    const user = await userModel.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // 3. Vérifier le statut
    if (user.statut === 'suspendu') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été suspendu. Contactez l\'administrateur.'
      });
    }

    if (user.statut === 'inactif') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte est inactif. Contactez l\'administrateur.'
      });
    }

    // 4. Vérifier le mot de passe
    const isPasswordValid = await userModel.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // 5. Mettre à jour le dernier login
    await userModel.updateLastLogin(user.id);

    // 6. Générer les tokens
    const tokens = generateTokenPair(user);

    // 7. Préparer les données utilisateur
    const userData = {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role,
      telephone: user.telephone,
      photo_profil: user.photo_profil,
      specialite: user.specialite
    };

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: userData,
        ...tokens
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
};

// ========== RAFRAÎCHISSEMENT DU TOKEN ==========
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Token de rafraîchissement requis'
      });
    }

    // 1. Vérifier le refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token de rafraîchissement invalide ou expiré'
      });
    }

    // 2. Vérifier que c'est bien un refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Type de token invalide'
      });
    }

    // 3. Récupérer l'utilisateur
    const userModel = new User(req.db);
    const user = await userModel.findById(decoded.id);

    if (!user || user.statut !== 'actif') {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    // 4. Générer de nouveaux tokens
    const tokens = generateTokenPair(user);

    res.json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: tokens
    });
  } catch (error) {
    console.error('Erreur refresh token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du rafraîchissement du token'
    });
  }
};

// ========== PROFIL ACTUEL ==========
const getCurrentUser = async (req, res) => {
  try {
    const userModel = new User(req.db);
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        telephone: user.telephone,
        adresse: user.adresse,
        date_naissance: user.date_naissance,
        sexe: user.sexe,
        statut: user.statut,
        photo_profil: user.photo_profil,
        specialite: user.specialite,
        numero_licence: user.numero_licence,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

// ========== MISE À JOUR DU PROFIL ==========
const updateProfile = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      telephone,
      adresse,
      date_naissance,
      sexe,
      photo_profil
    } = req.body;

    const userModel = new User(req.db);
    
    await userModel.updateProfile(req.user.id, {
      nom,
      prenom,
      telephone,
      adresse,
      date_naissance,
      sexe,
      photo_profil
    });

    const updatedUser = await userModel.findById(req.user.id);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        id: updatedUser.id,
        nom: updatedUser.nom,
        prenom: updatedUser.prenom,
        email: updatedUser.email,
        role: updatedUser.role,
        telephone: updatedUser.telephone,
        adresse: updatedUser.adresse,
        date_naissance: updatedUser.date_naissance,
        sexe: updatedUser.sexe,
        photo_profil: updatedUser.photo_profil
      }
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
};

// ========== CHANGEMENT DE MOT DE PASSE ==========
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // 1. Validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les nouveaux mots de passe ne correspondent pas'
      });
    }

    // 2. Validation de la force du nouveau mot de passe
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Nouveau mot de passe trop faible',
        errors: passwordValidation.errors
      });
    }

    // 3. Récupérer l'utilisateur complet
    const userModel = new User(req.db);
    const user = await userModel.findByEmail(req.user.email);

    // 4. Vérifier l'ancien mot de passe
    const isPasswordValid = await userModel.verifyPassword(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // 5. Mettre à jour le mot de passe
    await userModel.updatePassword(req.user.id, newPassword);

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
};

// ========== DÉCONNEXION ==========
const logout = async (req, res) => {
  try {
    // Côté serveur, on peut invalider le token (si on utilise une blacklist)
    // Pour l'instant, la déconnexion est gérée côté client en supprimant le token
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout
};