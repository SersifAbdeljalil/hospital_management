// ============================================
// MODÈLE USER - GESTION DES UTILISATEURS
// Système d'authentification et autorisation
// ============================================

const bcrypt = require('bcryptjs');

class User {
  constructor(db) {
    this.db = db;
  }

  // ========== CRÉATION D'UTILISATEUR ==========
  async create(userData) {
    const {
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
    } = userData;

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO users (
        nom, prenom, email, password, role, telephone, 
        adresse, date_naissance, sexe, specialite, numero_licence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await this.db.execute(query, [
      nom,
      prenom,
      email.toLowerCase(),
      hashedPassword,
      role,
      telephone || null,
      adresse || null,
      date_naissance || null,
      sexe || null,
      specialite || null,
      numero_licence || null
    ]);

    return result.insertId;
  }

  // ========== RECHERCHE PAR EMAIL ==========
  async findByEmail(email) {
    const query = `
      SELECT * FROM users 
      WHERE email = ? AND statut != 'suspendu'
    `;
    
    const [users] = await this.db.execute(query, [email.toLowerCase()]);
    return users[0] || null;
  }

  // ========== RECHERCHE PAR ID ==========
  async findById(id) {
    const query = `
      SELECT id, nom, prenom, email, role, telephone, adresse, 
             date_naissance, sexe, statut, photo_profil, specialite, 
             numero_licence, created_at, last_login
      FROM users 
      WHERE id = ?
    `;
    
    const [users] = await this.db.execute(query, [id]);
    return users[0] || null;
  }

  // ========== VÉRIFICATION DU MOT DE PASSE ==========
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // ========== MISE À JOUR DU DERNIER LOGIN ==========
  async updateLastLogin(userId) {
    const query = `
      UPDATE users 
      SET last_login = NOW() 
      WHERE id = ?
    `;
    
    await this.db.execute(query, [userId]);
  }

  // ========== MISE À JOUR DU PROFIL ==========
  async updateProfile(userId, updateData) {
    const {
      nom,
      prenom,
      telephone,
      adresse,
      date_naissance,
      sexe,
      photo_profil
    } = updateData;

    const query = `
      UPDATE users 
      SET nom = ?, prenom = ?, telephone = ?, adresse = ?, 
          date_naissance = ?, sexe = ?, photo_profil = ?
      WHERE id = ?
    `;

    await this.db.execute(query, [
      nom,
      prenom,
      telephone,
      adresse,
      date_naissance,
      sexe,
      photo_profil,
      userId
    ]);
  }

  // ========== CHANGEMENT DE MOT DE PASSE ==========
  async updatePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const query = `
      UPDATE users 
      SET password = ? 
      WHERE id = ?
    `;
    
    await this.db.execute(query, [hashedPassword, userId]);
  }

  // ========== LISTE DES UTILISATEURS ==========
  async findAll(filters = {}) {
    let query = `
      SELECT id, nom, prenom, email, role, telephone, 
             statut, specialite, created_at, last_login
      FROM users 
      WHERE 1=1
    `;
    const params = [];

    // Filtre par rôle
    if (filters.role) {
      query += ` AND role = ?`;
      params.push(filters.role);
    }

    // Filtre par statut
    if (filters.statut) {
      query += ` AND statut = ?`;
      params.push(filters.statut);
    }

    // Recherche par nom/prénom
    if (filters.search) {
      query += ` AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY created_at DESC`;

    const [users] = await this.db.execute(query, params);
    return users;
  }

  // ========== MISE À JOUR DU STATUT ==========
  async updateStatut(userId, statut) {
    const query = `
      UPDATE users 
      SET statut = ? 
      WHERE id = ?
    `;
    
    await this.db.execute(query, [statut, userId]);
  }

  // ========== SUPPRESSION D'UTILISATEUR ==========
  async delete(userId) {
    const query = `DELETE FROM users WHERE id = ?`;
    await this.db.execute(query, [userId]);
  }

  // ========== STATISTIQUES PAR RÔLE ==========
  async getStatsByRole() {
    const query = `
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE statut = 'actif'
      GROUP BY role
    `;
    
    const [stats] = await this.db.execute(query);
    return stats;
  }

  // ========== MÉDECINS ACTIFS ==========
  async getActiveDoctors() {
    const query = `
      SELECT id, nom, prenom, specialite, email, telephone
      FROM users 
      WHERE role = 'medecin' AND statut = 'actif'
      ORDER BY nom, prenom
    `;
    
    const [doctors] = await this.db.execute(query);
    return doctors;
  }
}

module.exports = User;