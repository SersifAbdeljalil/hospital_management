// ============================================
// CONFIGURATION AUTHENTIFICATION JWT
// Gestion des tokens et sécurité
// ============================================

const jwt = require('jsonwebtoken');

// ========== CONFIGURATION JWT ==========
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'votre_secret_super_securise_a_changer',
  accessTokenExpiry: '24h',      // Token d'accès valide 24h
  refreshTokenExpiry: '7d',      // Token de rafraîchissement valide 7 jours
  algorithm: 'HS256'
};

// ========== GÉNÉRATION DE TOKEN D'ACCÈS ==========
const generateAccessToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    nom: user.nom,
    prenom: user.prenom,
    type: 'access'
  };

  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.accessTokenExpiry,
    algorithm: JWT_CONFIG.algorithm
  });
};

// ========== GÉNÉRATION DE TOKEN DE RAFRAÎCHISSEMENT ==========
const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.refreshTokenExpiry,
    algorithm: JWT_CONFIG.algorithm
  });
};

// ========== VÉRIFICATION DE TOKEN ==========
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expiré');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token invalide');
    }
    throw error;
  }
};

// ========== DÉCODAGE DE TOKEN SANS VÉRIFICATION ==========
const decodeToken = (token) => {
  return jwt.decode(token);
};

// ========== GÉNÉRATION DES DEUX TOKENS ==========
const generateTokenPair = (user) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
};

// ========== EXTRACTION DU TOKEN DEPUIS LE HEADER ==========
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
};

// ========== VALIDATION DE LA FORCE DU MOT DE PASSE ==========
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${minLength} caractères`);
  }
  if (!hasUpperCase) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  if (!hasLowerCase) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  if (!hasNumbers) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  if (!hasSpecialChar) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ========== VALIDATION D'EMAIL ==========
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ========== RÔLES ET PERMISSIONS ==========
const ROLES = {
  ADMIN: 'admin',
  MEDECIN: 'medecin',
  INFIRMIER: 'infirmier',
  RECEPTIONNISTE: 'receptionniste',
  PATIENT: 'patient'
};

const ROLE_HIERARCHY = {
  admin: 5,
  medecin: 4,
  infirmier: 3,
  receptionniste: 2,
  patient: 1
};

// Vérifier si un rôle a la permission
const hasPermission = (userRole, requiredRole) => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// ========== PERMISSIONS PAR RESSOURCE ==========
const PERMISSIONS = {
  patients: {
    create: ['admin', 'receptionniste'],
    read: ['admin', 'medecin', 'infirmier', 'receptionniste'],
    update: ['admin', 'medecin', 'receptionniste'],
    delete: ['admin']
  },
  appointments: {
    create: ['admin', 'medecin', 'receptionniste'],
    read: ['admin', 'medecin', 'infirmier', 'receptionniste'],
    update: ['admin', 'medecin', 'receptionniste'],
    delete: ['admin', 'medecin', 'receptionniste']
  },
  consultations: {
    create: ['admin', 'medecin'],
    read: ['admin', 'medecin', 'infirmier'],
    update: ['admin', 'medecin'],
    delete: ['admin']
  },
  prescriptions: {
    create: ['admin', 'medecin'],
    read: ['admin', 'medecin', 'infirmier'],
    update: ['admin', 'medecin'],
    delete: ['admin', 'medecin']
  },
  invoices: {
    create: ['admin', 'receptionniste'],
    read: ['admin', 'receptionniste'],
    update: ['admin', 'receptionniste'],
    delete: ['admin']
  },
  users: {
    create: ['admin'],
    read: ['admin'],
    update: ['admin'],
    delete: ['admin']
  }
};

// Vérifier la permission sur une ressource
const checkResourcePermission = (userRole, resource, action) => {
  if (!PERMISSIONS[resource] || !PERMISSIONS[resource][action]) {
    return false;
  }
  
  return PERMISSIONS[resource][action].includes(userRole);
};

module.exports = {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  decodeToken,
  extractTokenFromHeader,
  validatePasswordStrength,
  validateEmail,
  ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  hasPermission,
  checkResourcePermission
};