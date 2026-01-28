// ============================================
// MIDDLEWARE RÔLES ET PERMISSIONS
// Contrôle d'accès basé sur les rôles (RBAC)
// ============================================

const { 
  ROLES, 
  hasPermission, 
  checkResourcePermission 
} = require('../config/auth');

// ========== VÉRIFICATION DU RÔLE EXACT ==========
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis: ${allowedRoles.join(' ou ')}`
      });
    }

    next();
  };
};

// ========== VÉRIFICATION ADMIN ==========
const requireAdmin = requireRole(ROLES.ADMIN);

// ========== VÉRIFICATION MÉDECIN ==========
const requireDoctor = requireRole(ROLES.MEDECIN, ROLES.ADMIN);

// ========== VÉRIFICATION INFIRMIER ==========
const requireNurse = requireRole(ROLES.INFIRMIER, ROLES.MEDECIN, ROLES.ADMIN);

// ========== VÉRIFICATION RÉCEPTIONNISTE ==========
const requireReceptionist = requireRole(ROLES.RECEPTIONNISTE, ROLES.ADMIN);

// ========== VÉRIFICATION STAFF MÉDICAL ==========
const requireMedicalStaff = requireRole(
  ROLES.ADMIN,
  ROLES.MEDECIN,
  ROLES.INFIRMIER
);

// ========== VÉRIFICATION STAFF ADMINISTRATIF ==========
const requireAdminStaff = requireRole(
  ROLES.ADMIN,
  ROLES.RECEPTIONNISTE
);

// ========== VÉRIFICATION PAR HIÉRARCHIE ==========
// Permet l'accès si le rôle de l'utilisateur est >= au rôle requis
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!hasPermission(req.user.role, minRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    next();
  };
};

// ========== VÉRIFICATION PAR RESSOURCE ET ACTION ==========
const requireResourcePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!checkResourcePermission(req.user.role, resource, action)) {
      return res.status(403).json({
        success: false,
        message: `Vous n'avez pas la permission de ${action} sur ${resource}`
      });
    }

    next();
  };
};

// ========== PERMISSIONS PERSONNALISÉES ==========
const checkCustomPermission = (permissionCheck) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentification requise'
        });
      }

      const hasAccess = await permissionCheck(req);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé'
        });
      }

      next();
    } catch (error) {
      console.error('Erreur vérification permission:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

// ========== MIDDLEWARE COMBINÉ (OU) ==========
// Permet l'accès si AU MOINS UNE condition est remplie
const requireAny = (...middlewares) => {
  return async (req, res, next) => {
    let lastError = null;
    
    for (const middleware of middlewares) {
      try {
        await new Promise((resolve, reject) => {
          middleware(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        // Si un middleware passe, on continue
        return next();
      } catch (error) {
        lastError = error;
      }
    }
    
    // Aucun middleware n'a passé
    return res.status(403).json({
      success: false,
      message: lastError?.message || 'Accès refusé'
    });
  };
};

// ========== MIDDLEWARE COMBINÉ (ET) ==========
// Nécessite que TOUTES les conditions soient remplies
const requireAll = (...middlewares) => {
  return async (req, res, next) => {
    try {
      for (const middleware of middlewares) {
        await new Promise((resolve, reject) => {
          middleware(req, res, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
      
      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: error.message || 'Accès refusé'
      });
    }
  };
};

// ========== PERMISSIONS SPÉCIFIQUES PAR ENTITÉ ==========

// Peut voir les consultations
const canViewConsultations = (req, res, next) => {
  const allowedRoles = ['admin', 'medecin', 'infirmier'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Seul le personnel médical peut consulter les consultations'
    });
  }
  
  next();
};

// Peut créer des consultations
const canCreateConsultation = (req, res, next) => {
  const allowedRoles = ['admin', 'medecin'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Seuls les médecins peuvent créer des consultations'
    });
  }
  
  next();
};

// Peut gérer les factures
const canManageInvoices = (req, res, next) => {
  const allowedRoles = ['admin', 'receptionniste'];
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Seul le personnel administratif peut gérer les factures'
    });
  }
  
  next();
};

// Peut gérer les utilisateurs
const canManageUsers = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Seuls les administrateurs peuvent gérer les utilisateurs'
    });
  }
  
  next();
};

// ========== VÉRIFICATION MÉDECIN ASSIGNÉ ==========
// Vérifie que le médecin est assigné au patient
const isDoctorAssigned = async (req, res, next) => {
  try {
    // Admin et réceptionnistes peuvent accéder à tout
    if (['admin', 'receptionniste'].includes(req.user.role)) {
      return next();
    }

    if (req.user.role !== 'medecin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux médecins'
      });
    }

    const patientId = req.params.patientId || req.body.patient_id;
    
    if (!patientId) {
      return next(); // Laisser le contrôleur gérer l'erreur
    }

    // Vérifier si le médecin a des rendez-vous avec ce patient
    const [appointments] = await req.db.execute(
      `SELECT id FROM appointments 
       WHERE patient_id = ? AND medecin_id = ? 
       LIMIT 1`,
      [patientId, req.user.id]
    );

    if (appointments.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas assigné à ce patient'
      });
    }

    next();
  } catch (error) {
    console.error('Erreur vérification médecin assigné:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions'
    });
  }
};

module.exports = {
  // Rôles simples
  requireRole,
  requireAdmin,
  requireDoctor,
  requireNurse,
  requireReceptionist,
  requireMedicalStaff,
  requireAdminStaff,
  
  // Par hiérarchie
  requireMinRole,
  
  // Par ressource
  requireResourcePermission,
  
  // Personnalisé
  checkCustomPermission,
  
  // Combinaisons
  requireAny,
  requireAll,
  
  // Permissions spécifiques
  canViewConsultations,
  canCreateConsultation,
  canManageInvoices,
  canManageUsers,
  isDoctorAssigned
};