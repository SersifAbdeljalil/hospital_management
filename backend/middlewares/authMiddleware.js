// ============================================
// MIDDLEWARE AUTHENTIFICATION
// Vérification des tokens JWT
// ============================================

const { verifyToken, extractTokenFromHeader } = require('../config/auth');
const User = require('../models/User');

// ========== MIDDLEWARE AUTH PRINCIPAL ==========
const authenticate = async (req, res, next) => {
  try {
    // 1. Extraire le token du header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token manquant.'
      });
    }

    // 2. Vérifier et décoder le token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message || 'Token invalide ou expiré'
      });
    }

    // 3. Vérifier que c'est un token d'accès
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Type de token invalide'
      });
    }

    // 4. Récupérer l'utilisateur depuis la base de données
    const userModel = new User(req.db);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // 5. Vérifier le statut de l'utilisateur
    if (user.statut === 'inactif' || user.statut === 'suspendu') {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé ou suspendu'
      });
    }

    // 6. Attacher l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom,
      statut: user.statut
    };

    next();
  } catch (error) {
    console.error('Erreur middleware auth:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification'
    });
  }
};

// ========== MIDDLEWARE OPTIONNEL ==========
// Authentifie si token présent, sinon continue
const authenticateOptional = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return next();
    }

    try {
      const decoded = verifyToken(token);
      
      if (decoded.type === 'access') {
        const userModel = new User(req.db);
        const user = await userModel.findById(decoded.id);

        if (user && user.statut === 'actif') {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            nom: user.nom,
            prenom: user.prenom
          };
        }
      }
    } catch (error) {
      // Token invalide, mais on continue quand même
      console.log('Token optionnel invalide:', error.message);
    }

    next();
  } catch (error) {
    console.error('Erreur middleware auth optionnel:', error);
    next();
  }
};

// ========== VÉRIFICATION DU PROPRIÉTAIRE ==========
// Vérifie que l'utilisateur accède à ses propres données
const isOwner = (paramName = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = parseInt(req.params[paramName]);
    const currentUserId = req.user.id;

    // Admin peut accéder à tout
    if (req.user.role === 'admin') {
      return next();
    }

    // Vérifier si c'est le propriétaire
    if (resourceUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez accéder qu\'à vos propres données.'
      });
    }

    next();
  };
};

// ========== VÉRIFICATION PATIENT ==========
// Vérifie que le patient accède à son propre dossier
const isPatientOwner = async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.patientId || req.params.id);
    
    // Admin et staff médical peuvent accéder à tous les patients
    if (['admin', 'medecin', 'infirmier', 'receptionniste'].includes(req.user.role)) {
      return next();
    }

    // Pour les patients, vérifier qu'ils accèdent à leur propre dossier
    if (req.user.role === 'patient') {
      const db = req.db;
      const [patients] = await db.execute(
        'SELECT id FROM patients WHERE id = ? AND user_id = ?',
        [patientId, req.user.id]
      );

      if (patients.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé à ce dossier patient'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Erreur vérification propriétaire patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions'
    });
  }
};

// ========== LIMITATION DES TENTATIVES DE CONNEXION ==========
const loginAttempts = new Map();

const rateLimitLogin = (req, res, next) => {
  const identifier = req.body.email || req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!loginAttempts.has(identifier)) {
    loginAttempts.set(identifier, []);
  }

  const attempts = loginAttempts.get(identifier);
  
  // Nettoyer les anciennes tentatives
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...recentAttempts);
    const remainingTime = Math.ceil((windowMs - (now - oldestAttempt)) / 1000 / 60);
    
    return res.status(429).json({
      success: false,
      message: `Trop de tentatives de connexion. Réessayez dans ${remainingTime} minute(s).`
    });
  }

  recentAttempts.push(now);
  loginAttempts.set(identifier, recentAttempts);
  
  next();
};

// Nettoyer les anciennes tentatives toutes les heures
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  
  for (const [identifier, attempts] of loginAttempts.entries()) {
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length === 0) {
      loginAttempts.delete(identifier);
    } else {
      loginAttempts.set(identifier, recentAttempts);
    }
  }
}, 60 * 60 * 1000);

module.exports = {
  authenticate,
  authenticateOptional,
  isOwner,
  isPatientOwner,
  rateLimitLogin
};