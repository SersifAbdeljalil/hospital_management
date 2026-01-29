const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const { sendResetPasswordEmail } = require('../utils/emailService');
require('dotenv').config();

// Générer un code de vérification à 6 caractères (lettres et chiffres)
const generateVerificationCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Générer un token JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Inscription (Register)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { nom, prenom, email, password, role, telephone, adresse, date_naissance, sexe } = req.body;

    // Vérifier si tous les champs requis sont présents
    if (!nom || !prenom || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Vérifier la force du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Créer l'utilisateur
    const userId = await User.create({
      nom,
      prenom,
      email,
      password,
      role,
      telephone,
      adresse,
      date_naissance,
      sexe
    });

    // Si c'est un patient, créer automatiquement l'entrée dans la table patients
    if (role === 'patient') {
      try {
        const year = new Date().getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const numero_dossier = `PAT-${year}-${randomNum}`;

        await query(
          'INSERT INTO patients (user_id, numero_dossier) VALUES (?, ?)',
          [userId, numero_dossier]
        );

        console.log(`✅ Dossier patient créé: ${numero_dossier} pour user_id: ${userId}`);
      } catch (patientError) {
        console.error('❌ Erreur lors de la création du dossier patient:', patientError);
      }
    }

    // Récupérer l'utilisateur créé
    const user = await User.findById(userId);

    // Générer le token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        telephone: user.telephone,
        statut: user.statut
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message
    });
  }
};

// @desc    Connexion (Login)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    if (user.statut !== 'actif') {
      return res.status(403).json({
        success: false,
        message: 'Votre compte est inactif. Contactez l\'administrateur.'
      });
    }

    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Si c'est un patient, vérifier qu'il a une entrée dans la table patients
    if (user.role === 'patient') {
      try {
        const patientResult = await query(
          'SELECT id FROM patients WHERE user_id = ?',
          [user.id]
        );

        if (!patientResult || patientResult.length === 0) {
          const year = new Date().getFullYear();
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          const numero_dossier = `PAT-${year}-${randomNum}`;

          await query(
            'INSERT INTO patients (user_id, numero_dossier) VALUES (?, ?)',
            [user.id, numero_dossier]
          );

          console.log(`✅ Dossier patient créé automatiquement lors de la connexion: ${numero_dossier}`);
        }
      } catch (patientError) {
        console.error('❌ Erreur lors de la vérification/création du dossier patient:', patientError);
      }
    }

    await User.updateLastLogin(user.id);

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        telephone: user.telephone,
        statut: user.statut,
        specialite: user.specialite
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// @desc    Obtenir l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    let patientId = null;
    if (user.role === 'patient') {
      try {
        const patientResult = await query(
          'SELECT id, numero_dossier FROM patients WHERE user_id = ?',
          [user.id]
        );

        if (patientResult && patientResult.length > 0) {
          patientId = patientResult[0].id;
          user.numero_dossier = patientResult[0].numero_dossier;
        }
      } catch (patientError) {
        console.error('Erreur lors de la récupération du patient_id:', patientError);
      }
    }

    res.status(200).json({
      success: true,
      user: {
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
        specialite: user.specialite,
        numero_licence: user.numero_licence,
        photo_profil: user.photo_profil,
        patient_id: patientId,
        numero_dossier: user.numero_dossier
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Déconnexion (Logout)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error.message
    });
  }
};

// @desc    Changer le mot de passe
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    const user = await User.findById(req.user.id);

    const isPasswordValid = await User.comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    await User.update(req.user.id, { password: newPassword });

    res.status(200).json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error.message
    });
  }
};

// @desc    Demander la réinitialisation du mot de passe (Forgot Password)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      // Par sécurité, on renvoie toujours un message positif même si l'email n'existe pas
      return res.status(200).json({
        success: true,
        message: 'Si cet email existe, un code de vérification a été envoyé.'
      });
    }

    // Générer un code de vérification à 6 caractères
    const verificationCode = generateVerificationCode();
    const resetTokenExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Sauvegarder le code dans la base de données
    await query(
      'UPDATE users SET reset_password_token = ?, reset_password_expire = ? WHERE id = ?',
      [verificationCode, resetTokenExpire, user.id]
    );

    // Envoyer l'email avec le code
    try {
      await sendResetPasswordEmail(user.email, verificationCode, user.nom, user.prenom);

      res.status(200).json({
        success: true,
        message: 'Code de vérification envoyé avec succès'
      });
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      
      // Supprimer le code si l'email n'a pas pu être envoyé
      await query(
        'UPDATE users SET reset_password_token = NULL, reset_password_expire = NULL WHERE id = ?',
        [user.id]
      );

      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email'
      });
    }
  } catch (error) {
    console.error('Erreur forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Vérifier le code de vérification
// @route   POST /api/auth/verify-reset-code
// @access  Public
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email et code requis'
      });
    }

    // Récupérer l'utilisateur
    const results = await query(
      'SELECT id, reset_password_token, reset_password_expire FROM users WHERE email = ?',
      [email]
    );

    if (!results || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email non trouvé'
      });
    }

    const user = results[0];

    // Vérifier si le code existe
    if (!user.reset_password_token) {
      return res.status(400).json({
        success: false,
        message: 'Aucun code de réinitialisation trouvé'
      });
    }

    // Vérifier si le code est expiré
    const now = new Date();
    const expireDate = new Date(user.reset_password_expire);
    
    if (expireDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Code expiré'
      });
    }

    // Comparer les codes (insensible à la casse)
    if (user.reset_password_token.toUpperCase() !== code.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'Code invalide'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Code valide'
    });
  } catch (error) {
    console.error('Erreur verify code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// @desc    Réinitialiser le mot de passe avec le code
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, code et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Récupérer l'utilisateur
    const results = await query(
      'SELECT id, reset_password_token, reset_password_expire FROM users WHERE email = ?',
      [email]
    );

    if (!results || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Email non trouvé'
      });
    }

    const user = results[0];

    // Vérifier si le code existe
    if (!user.reset_password_token) {
      return res.status(400).json({
        success: false,
        message: 'Aucun code de réinitialisation trouvé'
      });
    }

    // Vérifier si le code est expiré
    const now = new Date();
    const expireDate = new Date(user.reset_password_expire);
    
    if (expireDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Code expiré'
      });
    }

    // Comparer les codes (insensible à la casse)
    if (user.reset_password_token.toUpperCase() !== code.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'Code invalide'
      });
    }

    const userId = user.id;

    // Mettre à jour le mot de passe et supprimer le code
    await User.update(userId, { password: newPassword });
    await query(
      'UPDATE users SET reset_password_token = NULL, reset_password_expire = NULL WHERE id = ?',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};