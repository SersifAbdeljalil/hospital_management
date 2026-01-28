const { query } = require('../config/database');

// @desc    Obtenir tous mes patients (médecin connecté)
// @route   GET /api/my-patients
// @access  Private (medecin)
exports.getMyPatients = async (req, res) => {
  try {
    const medecinId = req.user.id;
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT DISTINCT
        p.id,
        p.numero_dossier,
        p.groupe_sanguin,
        u.nom,
        u.prenom,
        u.email,
        u.telephone,
        u.date_naissance,
        u.sexe,
        u.adresse,
        (SELECT COUNT(*) FROM appointments WHERE patient_id = p.id AND medecin_id = ?) as total_rdv,
        (SELECT MAX(date_heure) FROM appointments WHERE patient_id = p.id AND medecin_id = ?) as dernier_rdv,
        (SELECT COUNT(*) FROM consultations WHERE patient_id = p.id AND medecin_id = ?) as total_consultations
      FROM patients p
      INNER JOIN users u ON p.user_id = u.id
      WHERE EXISTS (
        SELECT 1 FROM appointments a 
        WHERE a.patient_id = p.id AND a.medecin_id = ?
      )
    `;

    const params = [medecinId, medecinId, medecinId, medecinId];

    // Recherche
    if (search) {
      sql += ` AND (
        u.nom LIKE ? OR 
        u.prenom LIKE ? OR 
        p.numero_dossier LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Compter le total
    const countSql = sql.replace(/SELECT DISTINCT.*FROM/, 'SELECT COUNT(DISTINCT p.id) as total FROM');
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Pagination
    sql += ` ORDER BY u.nom, u.prenom LIMIT ? OFFSET ?`;
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
    console.error('Erreur getMyPatients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des patients',
      error: error.message
    });
  }
};

// @desc    Obtenir détails d'un patient
// @route   GET /api/my-patients/:id
// @access  Private (medecin)
exports.getMyPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const medecinId = req.user.id;

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
        mr.antecedents_medicaux,
        mr.antecedents_chirurgicaux,
        mr.antecedents_familiaux,
        mr.allergies,
        mr.maladies_chroniques,
        mr.medicaments_actuels
      FROM patients p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN medical_records mr ON p.id = mr.patient_id
      WHERE p.id = ?
      AND EXISTS (
        SELECT 1 FROM appointments 
        WHERE patient_id = p.id AND medecin_id = ?
      )
    `;

    const result = await query(sql, [id, medecinId]);
    const patient = result[0];

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Historique des rendez-vous
    const appointments = await query(`
      SELECT * FROM appointments 
      WHERE patient_id = ? AND medecin_id = ?
      ORDER BY date_heure DESC
      LIMIT 10
    `, [id, medecinId]);

    // Dernières consultations
    const consultations = await query(`
      SELECT * FROM consultations 
      WHERE patient_id = ? AND medecin_id = ?
      ORDER BY date_consultation DESC
      LIMIT 5
    `, [id, medecinId]);

    res.status(200).json({
      success: true,
      data: {
        ...patient,
        appointments,
        consultations
      }
    });
  } catch (error) {
    console.error('Erreur getMyPatientById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du patient',
      error: error.message
    });
  }
};