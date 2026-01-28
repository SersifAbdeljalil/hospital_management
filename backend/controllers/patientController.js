const { query } = require('../config/database');

// @desc    Obtenir tous les patients
// @route   GET /api/patients
// @access  Private (admin, medecin, infirmier, receptionniste)
exports.getAllPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        p.id,
        p.numero_dossier,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.date_naissance,
        u.sexe,
        u.adresse,
        p.groupe_sanguin,
        p.created_at
      FROM patients p
      INNER JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    // Recherche
    if (search) {
      sql += ` AND (
        u.nom LIKE ? OR 
        u.prenom LIKE ? OR 
        p.numero_dossier LIKE ? OR
        u.email LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Compter le total
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await query(countSql, params);
    const total = countResult.total;

    // Pagination
    sql += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const patients = await query(sql, params);

    res.status(200).json({
      success: true,
      data: patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur getAllPatients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des patients',
      error: error.message
    });
  }
};

// @desc    Obtenir un patient par ID
// @route   GET /api/patients/:id
// @access  Private
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        p.*,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.date_naissance,
        u.sexe,
        u.adresse,
        u.photo_profil
      FROM patients p
      INNER JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;

    const [patient] = await query(sql, [id]);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Récupérer le dossier médical
    const medicalRecordSql = 'SELECT * FROM medical_records WHERE patient_id = ?';
    const [medicalRecord] = await query(medicalRecordSql, [id]);

    res.status(200).json({
      success: true,
      data: {
        ...patient,
        medical_record: medicalRecord || null
      }
    });
  } catch (error) {
    console.error('Erreur getPatientById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du patient',
      error: error.message
    });
  }
};

// @desc    Créer un nouveau patient
// @route   POST /api/patients
// @access  Private (admin, receptionniste)
exports.createPatient = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      telephone,
      date_naissance,
      sexe,
      adresse,
      groupe_sanguin,
      numero_securite_sociale,
      contact_urgence_nom,
      contact_urgence_telephone,
      contact_urgence_relation,
      profession,
      situation_familiale,
      assurance_nom,
      assurance_numero
    } = req.body;

    // Validation
    if (!nom || !prenom || !date_naissance || !sexe) {
      return res.status(400).json({
        success: false,
        message: 'Nom, prénom, date de naissance et sexe sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    if (email) {
      const checkEmail = await query('SELECT id FROM users WHERE email = ?', [email]);
      if (checkEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Générer un numéro de dossier unique
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const numero_dossier = `PAT-${year}-${randomNum}`;

    // Créer l'utilisateur
    const password = 'patient123'; // Mot de passe temporaire
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const userSql = `
      INSERT INTO users (nom, prenom, email, password, role, telephone, date_naissance, sexe, adresse, statut)
      VALUES (?, ?, ?, ?, 'patient', ?, ?, ?, ?, 'actif')
    `;

    const userResult = await query(userSql, [
      nom,
      prenom,
      email || `${numero_dossier}@temp.com`,
      hashedPassword,
      telephone,
      date_naissance,
      sexe,
      adresse
    ]);

    const user_id = userResult.insertId;

    // Créer le patient
    const patientSql = `
      INSERT INTO patients (
        user_id, numero_dossier, groupe_sanguin, numero_securite_sociale,
        contact_urgence_nom, contact_urgence_telephone, contact_urgence_relation,
        profession, situation_familiale, assurance_nom, assurance_numero
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const patientResult = await query(patientSql, [
      user_id,
      numero_dossier,
      groupe_sanguin,
      numero_securite_sociale,
      contact_urgence_nom,
      contact_urgence_telephone,
      contact_urgence_relation,
      profession,
      situation_familiale,
      assurance_nom,
      assurance_numero
    ]);

    // Créer le dossier médical vide
    const medicalRecordSql = 'INSERT INTO medical_records (patient_id) VALUES (?)';
    await query(medicalRecordSql, [patientResult.insertId]);

    res.status(201).json({
      success: true,
      message: 'Patient créé avec succès',
      data: {
        id: patientResult.insertId,
        user_id,
        numero_dossier
      }
    });
  } catch (error) {
    console.error('Erreur createPatient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du patient',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un patient
// @route   PUT /api/patients/:id
// @access  Private
exports.updatePatient = async (req, res) => {
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
      groupe_sanguin,
      numero_securite_sociale,
      contact_urgence_nom,
      contact_urgence_telephone,
      contact_urgence_relation,
      profession,
      situation_familiale,
      assurance_nom,
      assurance_numero
    } = req.body;

    // Vérifier si le patient existe
    const [patient] = await query('SELECT user_id FROM patients WHERE id = ?', [id]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Mettre à jour l'utilisateur
    const userSql = `
      UPDATE users 
      SET nom = ?, prenom = ?, email = ?, telephone = ?, 
          date_naissance = ?, sexe = ?, adresse = ?
      WHERE id = ?
    `;

    await query(userSql, [
      nom,
      prenom,
      email,
      telephone,
      date_naissance,
      sexe,
      adresse,
      patient.user_id
    ]);

    // Mettre à jour le patient
    const patientSql = `
      UPDATE patients 
      SET groupe_sanguin = ?, numero_securite_sociale = ?,
          contact_urgence_nom = ?, contact_urgence_telephone = ?, 
          contact_urgence_relation = ?, profession = ?, 
          situation_familiale = ?, assurance_nom = ?, assurance_numero = ?
      WHERE id = ?
    `;

    await query(patientSql, [
      groupe_sanguin,
      numero_securite_sociale,
      contact_urgence_nom,
      contact_urgence_telephone,
      contact_urgence_relation,
      profession,
      situation_familiale,
      assurance_nom,
      assurance_numero,
      id
    ]);

    res.status(200).json({
      success: true,
      message: 'Patient mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur updatePatient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du patient',
      error: error.message
    });
  }
};

// @desc    Supprimer un patient
// @route   DELETE /api/patients/:id
// @access  Private (admin uniquement)
exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le patient existe
    const [patient] = await query('SELECT user_id FROM patients WHERE id = ?', [id]);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Supprimer le patient (cascade supprimera les données liées)
    await query('DELETE FROM patients WHERE id = ?', [id]);
    await query('DELETE FROM users WHERE id = ?', [patient.user_id]);

    res.status(200).json({
      success: true,
      message: 'Patient supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deletePatient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du patient',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le dossier médical
// @route   PUT /api/patients/:id/medical-record
// @access  Private (medecin, infirmier)
exports.updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      antecedents_medicaux,
      antecedents_chirurgicaux,
      antecedents_familiaux,
      allergies,
      maladies_chroniques,
      medicaments_actuels,
      vaccinations,
      groupe_sanguin_confirme,
      donneur_organes,
      notes_importantes
    } = req.body;

    // Vérifier si le dossier médical existe
    const [existing] = await query('SELECT id FROM medical_records WHERE patient_id = ?', [id]);

    if (existing) {
      // Mettre à jour
      const sql = `
        UPDATE medical_records 
        SET antecedents_medicaux = ?, antecedents_chirurgicaux = ?,
            antecedents_familiaux = ?, allergies = ?, maladies_chroniques = ?,
            medicaments_actuels = ?, vaccinations = ?, groupe_sanguin_confirme = ?,
            donneur_organes = ?, notes_importantes = ?
        WHERE patient_id = ?
      `;

      await query(sql, [
        antecedents_medicaux,
        antecedents_chirurgicaux,
        antecedents_familiaux,
        allergies,
        maladies_chroniques,
        medicaments_actuels,
        vaccinations,
        groupe_sanguin_confirme,
        donneur_organes,
        notes_importantes,
        id
      ]);
    } else {
      // Créer
      const sql = `
        INSERT INTO medical_records (
          patient_id, antecedents_medicaux, antecedents_chirurgicaux,
          antecedents_familiaux, allergies, maladies_chroniques,
          medicaments_actuels, vaccinations, groupe_sanguin_confirme,
          donneur_organes, notes_importantes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await query(sql, [
        id,
        antecedents_medicaux,
        antecedents_chirurgicaux,
        antecedents_familiaux,
        allergies,
        maladies_chroniques,
        medicaments_actuels,
        vaccinations,
        groupe_sanguin_confirme,
        donneur_organes,
        notes_importantes
      ]);
    }

    res.status(200).json({
      success: true,
      message: 'Dossier médical mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur updateMedicalRecord:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du dossier médical',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques des patients
// @route   GET /api/patients/stats
// @access  Private (admin, medecin)
exports.getPatientStats = async (req, res) => {
  try {
    // Total patients
    const [totalResult] = await query('SELECT COUNT(*) as total FROM patients');
    const total = totalResult.total;

    // Par sexe
    const sexeSql = `
      SELECT u.sexe, COUNT(*) as count
      FROM patients p
      INNER JOIN users u ON p.user_id = u.id
      GROUP BY u.sexe
    `;
    const bySexe = await query(sexeSql);

    // Par groupe sanguin
    const groupeSanguinSql = `
      SELECT groupe_sanguin, COUNT(*) as count
      FROM patients
      WHERE groupe_sanguin IS NOT NULL
      GROUP BY groupe_sanguin
    `;
    const byGroupeSanguin = await query(groupeSanguinSql);

    // Nouveaux patients ce mois
    const thisMonthSql = `
      SELECT COUNT(*) as count
      FROM patients
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
      AND YEAR(created_at) = YEAR(CURRENT_DATE())
    `;
    const [thisMonth] = await query(thisMonthSql);

    res.status(200).json({
      success: true,
      data: {
        total,
        bySexe,
        byGroupeSanguin,
        newThisMonth: thisMonth.count
      }
    });
  } catch (error) {
    console.error('Erreur getPatientStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};