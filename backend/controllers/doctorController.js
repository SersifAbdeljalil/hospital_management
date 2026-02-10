const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// @desc    Obtenir tous les médecins
// @route   GET /api/doctors
// @access  Private (tous les utilisateurs authentifiés)
exports.getAllDoctors = async (req, res) => {
  try {
    const { search, page = 1, limit = 1000, statut = 'actif' } = req.query;
    
    console.log('📊 GET /api/doctors appelé par:', req.user?.email, '- Role:', req.user?.role);
    console.log('📊 Params:', { search, page, limit, statut });

    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        id,
        nom,
        prenom,
        email,
        telephone,
        date_naissance,
        sexe,
        adresse,
        specialite,
        numero_licence,
        statut,
        photo_profil,
        created_at
      FROM users
      WHERE role = 'medecin'
    `;

    const params = [];

    // Filtrer par statut
    if (statut && statut !== 'all') {
      sql += ` AND statut = ?`;
      params.push(statut);
    }

    // Recherche
    if (search) {
      sql += ` AND (
        nom LIKE ? OR 
        prenom LIKE ? OR 
        email LIKE ? OR
        specialite LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Compter le total
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    console.log('🔍 Total médecins trouvés:', total);

    // Pagination
    sql += ` ORDER BY nom ASC, prenom ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    console.log('🔍 SQL:', sql);
    console.log('🔍 Params:', params);

    const doctors = await query(sql, params);

    console.log(`✅ ${doctors.length} médecin(s) renvoyé(s) au client`);

    res.status(200).json({
      success: true,
      data: doctors,
      count: doctors.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Erreur getAllDoctors:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des médecins',
      error: error.message
    });
  }
};

// @desc    Obtenir un médecin par ID
// @route   GET /api/doctors/:id
// @access  Private
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📊 GET /api/doctors/:id - ID:', id);

    const sql = `
      SELECT 
        id,
        nom,
        prenom,
        email,
        telephone,
        date_naissance,
        sexe,
        adresse,
        specialite,
        numero_licence,
        statut,
        photo_profil,
        created_at,
        last_login
      FROM users
      WHERE id = ? AND role = 'medecin'
    `;

    const result = await query(sql, [id]);
    const doctor = result[0];

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Médecin non trouvé'
      });
    }

    console.log('✅ Médecin trouvé:', doctor.nom, doctor.prenom);

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('❌ Erreur getDoctorById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du médecin',
      error: error.message
    });
  }
};

// @desc    Créer un nouveau médecin
// @route   POST /api/doctors
// @access  Private (admin uniquement)
exports.createDoctor = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      telephone,
      date_naissance,
      sexe,
      adresse,
      specialite,
      numero_licence
    } = req.body;

    console.log('📊 POST /api/doctors - Création médecin:', email);

    // Validation
    if (!nom || !prenom || !email || !specialite) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prénom, email et spécialité sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    const checkEmail = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (checkEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Mot de passe temporaire (le médecin pourra le changer)
    const password = 'medecin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (
        nom, prenom, email, password, role, telephone, 
        date_naissance, sexe, adresse, specialite, 
        numero_licence, statut
      ) VALUES (?, ?, ?, ?, 'medecin', ?, ?, ?, ?, ?, ?, 'actif')
    `;

    const result = await query(sql, [
      nom,
      prenom,
      email,
      hashedPassword,
      telephone,
      date_naissance,
      sexe,
      adresse,
      specialite,
      numero_licence
    ]);

    console.log('✅ Médecin créé avec succès - ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Médecin créé avec succès',
      data: {
        id: result.insertId,
        email,
        password_temporaire: password
      }
    });
  } catch (error) {
    console.error('❌ Erreur createDoctor:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du médecin',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un médecin
// @route   PUT /api/doctors/:id
// @access  Private (admin)
exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom,
      prenom,
      email,
      telephone,
      date_naissance,
      sexe,
      adresse,
      specialite,
      numero_licence,
      statut
    } = req.body;

    console.log('📊 PUT /api/doctors/:id - ID:', id);

    // Vérifier si le médecin existe
    const checkResult = await query('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'medecin']);
    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Médecin non trouvé'
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const checkEmail = await query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (checkEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    const sql = `
      UPDATE users 
      SET nom = ?, prenom = ?, email = ?, telephone = ?, 
          date_naissance = ?, sexe = ?, adresse = ?,
          specialite = ?, numero_licence = ?, statut = ?
      WHERE id = ?
    `;

    await query(sql, [
      nom,
      prenom,
      email,
      telephone,
      date_naissance,
      sexe,
      adresse,
      specialite,
      numero_licence,
      statut,
      id
    ]);

    console.log('✅ Médecin mis à jour avec succès');

    res.status(200).json({
      success: true,
      message: 'Médecin mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur updateDoctor:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du médecin',
      error: error.message
    });
  }
};

// @desc    Supprimer un médecin
// @route   DELETE /api/doctors/:id
// @access  Private (admin uniquement)
exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📊 DELETE /api/doctors/:id - ID:', id);

    // Vérifier si le médecin existe
    const checkResult = await query('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'medecin']);
    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Médecin non trouvé'
      });
    }

    // Vérifier s'il a des consultations en cours
    const consultationsResult = await query(
      'SELECT COUNT(*) as count FROM consultations WHERE medecin_id = ? AND statut = ?',
      [id, 'en_cours']
    );

    if (consultationsResult[0]?.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer ce médecin car il a des consultations en cours'
      });
    }

    // Supprimer le médecin
    await query('DELETE FROM users WHERE id = ?', [id]);

    console.log('✅ Médecin supprimé avec succès');

    res.status(200).json({
      success: true,
      message: 'Médecin supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur deleteDoctor:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du médecin',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques des médecins
// @route   GET /api/doctors/stats
// @access  Private (admin)
exports.getDoctorStats = async (req, res) => {
  try {
    console.log('📊 GET /api/doctors/stats');

    // Total médecins
    const totalResult = await query('SELECT COUNT(*) as total FROM users WHERE role = ?', ['medecin']);
    const total = totalResult[0]?.total || 0;

    // Par statut
    const statusSql = `
      SELECT statut, COUNT(*) as count
      FROM users
      WHERE role = ?
      GROUP BY statut
    `;
    const byStatus = await query(statusSql, ['medecin']);

    // Par spécialité
    const specialitySql = `
      SELECT specialite, COUNT(*) as count
      FROM users
      WHERE role = ? AND specialite IS NOT NULL
      GROUP BY specialite
    `;
    const bySpecialty = await query(specialitySql, ['medecin']);

    // Médecins actifs
    const activeResult = await query(
      'SELECT COUNT(*) as count FROM users WHERE role = ? AND statut = ?',
      ['medecin', 'actif']
    );

    console.log('✅ Stats récupérées');

    res.status(200).json({
      success: true,
      data: {
        total,
        active: activeResult[0]?.count || 0,
        byStatus,
        bySpecialty
      }
    });
  } catch (error) {
    console.error('❌ Erreur getDoctorStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le profil du médecin (par le médecin lui-même)
// @route   PUT /api/doctors/profile
// @access  Private (medecin)
exports.updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id; // ID du médecin connecté
    const {
      nom,
      prenom,
      telephone,
      adresse,
      specialite,
      numero_licence
    } = req.body;

    console.log('📊 PUT /api/doctors/profile - User ID:', userId);

    const sql = `
      UPDATE users 
      SET nom = ?, prenom = ?, telephone = ?, adresse = ?,
          specialite = ?, numero_licence = ?
      WHERE id = ? AND role = ?
    `;

    await query(sql, [
      nom,
      prenom,
      telephone,
      adresse,
      specialite,
      numero_licence,
      userId,
      'medecin'
    ]);

    console.log('✅ Profil médecin mis à jour');

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur updateDoctorProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
};

// ⭐⭐⭐ NOUVELLES FONCTIONS - UPLOAD PHOTO ⭐⭐⭐

// @desc    Upload photo de profil
// @route   POST /api/doctors/profile/photo
// @access  Private (medecin)
exports.uploadProfilePhoto = async (req, res) => {
  try {
    // Vérifier si un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }

    const userId = req.user.id;

    console.log('📊 POST /api/doctors/profile/photo - User ID:', userId);
    console.log('📁 Fichier uploadé:', req.file.filename);

    // Récupérer l'ancien chemin de la photo
    const userResult = await query(
      'SELECT photo_profil FROM users WHERE id = ? AND role = ?',
      [userId, 'medecin']
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Médecin non trouvé'
      });
    }

    const user = userResult[0];

    // Supprimer l'ancienne photo si elle existe
    if (user.photo_profil) {
      const oldPhotoPath = path.join(__dirname, '..', user.photo_profil);
      if (fs.existsSync(oldPhotoPath)) {
        try {
          fs.unlinkSync(oldPhotoPath);
          console.log('✅ Ancienne photo supprimée');
        } catch (err) {
          console.error('⚠️ Erreur suppression ancienne photo:', err);
        }
      }
    }

    // Nouveau chemin de la photo
    const photoPath = `/uploads/profiles/${req.file.filename}`;

    // Mettre à jour la base de données
    await query(
      'UPDATE users SET photo_profil = ? WHERE id = ?',
      [photoPath, userId]
    );

    console.log('✅ Photo de profil mise à jour');

    res.status(200).json({
      success: true,
      message: 'Photo de profil mise à jour avec succès',
      data: {
        photo_profil: photoPath
      }
    });
  } catch (error) {
    console.error('❌ Erreur uploadProfilePhoto:', error);
    
    // Supprimer le fichier uploadé en cas d'erreur
    if (req.file) {
      const uploadedFilePath = req.file.path;
      if (fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de la photo',
      error: error.message
    });
  }
};

// @desc    Supprimer photo de profil
// @route   DELETE /api/doctors/profile/photo
// @access  Private (medecin)
exports.deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('📊 DELETE /api/doctors/profile/photo - User ID:', userId);

    // Récupérer le chemin de la photo
    const userResult = await query(
      'SELECT photo_profil FROM users WHERE id = ? AND role = ?',
      [userId, 'medecin']
    );

    if (userResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Médecin non trouvé'
      });
    }

    const user = userResult[0];

    if (!user.photo_profil) {
      return res.status(400).json({
        success: false,
        message: 'Aucune photo de profil à supprimer'
      });
    }

    // Supprimer le fichier physique
    const photoPath = path.join(__dirname, '..', user.photo_profil);
    if (fs.existsSync(photoPath)) {
      try {
        fs.unlinkSync(photoPath);
        console.log('✅ Photo supprimée du système de fichiers');
      } catch (err) {
        console.error('⚠️ Erreur suppression photo:', err);
      }
    }

    // Mettre à jour la base de données
    await query(
      'UPDATE users SET photo_profil = NULL WHERE id = ?',
      [userId]
    );

    console.log('✅ Photo de profil supprimée');

    res.status(200).json({
      success: true,
      message: 'Photo de profil supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur deleteProfilePhoto:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la photo',
      error: error.message
    });
  }
};