const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Créer un nouvel utilisateur
  static async create(userData) {
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

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (
        nom, prenom, email, password, role, telephone, 
        adresse, date_naissance, sexe, specialite, numero_licence, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'actif')
    `;

    const result = await query(sql, [
      nom,
      prenom,
      email,
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

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const results = await query(sql, [email]);
    return results[0] || null;
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ? LIMIT 1';
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // Trouver tous les utilisateurs
  static async findAll(filters = {}) {
    let sql = 'SELECT id, nom, prenom, email, role, telephone, statut, created_at FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      sql += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.statut) {
      sql += ' AND statut = ?';
      params.push(filters.statut);
    }

    sql += ' ORDER BY created_at DESC';

    return await query(sql, params);
  }

  // Mettre à jour un utilisateur
  static async update(id, userData) {
    const fields = [];
    const values = [];

    // Construire dynamiquement la requête
    Object.keys(userData).forEach(key => {
      if (key !== 'id' && key !== 'password' && userData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(userData[key]);
      }
    });

    // Si le mot de passe est fourni, le hasher
    if (userData.password) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      fields.push('password = ?');
      values.push(hashedPassword);
    }

    if (fields.length === 0) {
      throw new Error('Aucune donnée à mettre à jour');
    }

    values.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    const result = await query(sql, values);

    return result.affectedRows > 0;
  }

  // Supprimer un utilisateur
  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // Vérifier le mot de passe
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Mettre à jour la dernière connexion
  static async updateLastLogin(id) {
    const sql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    await query(sql, [id]);
  }

  // Changer le statut
  static async updateStatus(id, statut) {
    const sql = 'UPDATE users SET statut = ? WHERE id = ?';
    const result = await query(sql, [statut, id]);
    return result.affectedRows > 0;
  }

  // Compter les utilisateurs par rôle
  static async countByRole() {
    const sql = `
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE statut = 'actif'
      GROUP BY role
    `;
    return await query(sql);
  }
}

module.exports = User;