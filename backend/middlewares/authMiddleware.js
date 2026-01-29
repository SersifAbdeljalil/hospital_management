const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { query } = require('../config/database');
require('dotenv').config();

// Middleware pour protéger les routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier si le token est dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      });
    }

    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur (sans le mot de passe)
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier si l'utilisateur est actif
      if (user.statut !== 'actif') {
        return res.status(403).json({
          success: false,
          message: 'Compte inactif'
        });
      }

      // Ajouter l'utilisateur à la requête
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom
      };

      // ✅ NOUVEAU: Si c'est un patient, récupérer son patient_id
      if (user.role === 'patient') {
        try {
          const patientResult = await query(
            'SELECT id FROM patients WHERE user_id = ?',
            [user.id]
          );
          
          if (patientResult && patientResult.length > 0) {
            req.user.patient_id = patientResult[0].id;
          } else {
            console.warn(`⚠️ Utilisateur patient ${user.id} n'a pas d'entrée dans la table patients`);
          }
        } catch (patientError) {
          console.error('Erreur lors de la récupération du patient_id:', patientError);
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }
  } catch (error) {
    console.error('Erreur dans authMiddleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Middleware optionnel (route accessible avec ou sans auth)
exports.optional = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (user && user.statut === 'actif') {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            nom: user.nom,
            prenom: user.prenom
          };

          // Si c'est un patient, récupérer son patient_id
          if (user.role === 'patient') {
            try {
              const patientResult = await query(
                'SELECT id FROM patients WHERE user_id = ?',
                [user.id]
              );
              
              if (patientResult && patientResult.length > 0) {
                req.user.patient_id = patientResult[0].id;
              }
            } catch (patientError) {
              console.error('Erreur lors de la récupération du patient_id:', patientError);
            }
          }
        }
      } catch (error) {
        // Token invalide, continuer sans user
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// ✅ NOUVEAU: Middleware pour s'assurer que le patient_id existe
exports.ensurePatientId = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Si patient_id est déjà défini, continuer
    if (req.user.patient_id) {
      return next();
    }

    // Si c'est un patient, récupérer son patient_id
    if (req.user.role === 'patient') {
      const patientResult = await query(
        'SELECT id FROM patients WHERE user_id = ?',
        [req.user.id]
      );

      if (!patientResult || patientResult.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Profil patient non trouvé. Veuillez contacter l\'administrateur pour créer votre dossier patient.'
        });
      }

      req.user.patient_id = patientResult[0].id;
      next();
    } else {
      // Si ce n'est pas un patient, continuer normalement
      next();
    }
  } catch (error) {
    console.error('Erreur ensurePatientId:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Middleware pour autoriser certains rôles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource`
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur est admin
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est médecin
exports.isDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== 'medecin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux médecins'
    });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est infirmier
exports.isNurse = (req, res, next) => {
  if (!req.user || req.user.role !== 'infirmier') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux infirmiers'
    });
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est réceptionniste
exports.isReceptionist = (req, res, next) => {
  if (!req.user || req.user.role !== 'receptionniste') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux réceptionnistes'
    });
  }
  next();
};

// Middleware pour vérifier le personnel médical (médecin ou infirmier)
exports.isMedicalStaff = (req, res, next) => {
  if (!req.user || !['medecin', 'infirmier'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé au personnel médical'
    });
  }
  next();
};

// Middleware pour vérifier si c'est le propriétaire de la ressource ou un admin
exports.isOwnerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Admin a tous les droits
    if (req.user.role === 'admin') {
      return next();
    }

    // Vérifier si c'est le propriétaire
    if (req.user.id !== parseInt(resourceUserId)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette ressource'
      });
    }

    next();
  };
};