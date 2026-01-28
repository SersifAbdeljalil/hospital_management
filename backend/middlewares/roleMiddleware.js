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