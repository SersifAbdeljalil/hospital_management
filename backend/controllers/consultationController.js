const { query } = require('../config/database');

// @desc    Obtenir toutes les consultations
// @route   GET /api/consultations
// @access  Private (admin, medecin, infirmier, patient)
exports.getAllConsultations = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, patient_id, medecin_id, statut } = req.query;
    const offset = (page - 1) * limit;
    const userRole = req.user.role;
    const userId = req.user.id;

    let sql = `
      SELECT 
        c.*,
        p.numero_dossier,
        up.nom as patient_nom,
        up.prenom as patient_prenom,
        um.nom as medecin_nom,
        um.prenom as medecin_prenom,
        um.specialite
      FROM consultations c
      INNER JOIN patients p ON c.patient_id = p.id
      INNER JOIN users up ON p.user_id = up.id
      INNER JOIN users um ON c.medecin_id = um.id
      WHERE 1=1
    `;

    const params = [];

    // Filtrer selon le rôle
    if (userRole === 'medecin') {
      sql += ` AND c.medecin_id = ?`;
      params.push(userId);
    } else if (userRole === 'patient') {
      sql += ` AND p.user_id = ?`;
      params.push(userId);
    }

    // Filtres supplémentaires
    if (patient_id) {
      sql += ` AND c.patient_id = ?`;
      params.push(patient_id);
    }

    if (medecin_id) {
      sql += ` AND c.medecin_id = ?`;
      params.push(medecin_id);
    }

    if (statut) {
      sql += ` AND c.statut = ?`;
      params.push(statut);
    }

    // Recherche
    if (search) {
      sql += ` AND (
        up.nom LIKE ? OR 
        up.prenom LIKE ? OR 
        p.numero_dossier LIKE ? OR
        c.diagnostic LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Compter le total
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await query(countSql, params);
    
    // ✅ Correction: Vérifier si countResult existe et a des données
    const total = (countResult && countResult.length > 0) ? countResult[0].total : 0;

    // Pagination
    sql += ` ORDER BY c.date_consultation DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const consultations = await query(sql, params);

    res.status(200).json({
      success: true,
      data: consultations || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur getAllConsultations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des consultations',
      error: error.message
    });
  }
};

// @desc    Obtenir une consultation par ID
// @route   GET /api/consultations/:id
// @access  Private
exports.getConsultationById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        c.*,
        p.numero_dossier,
        p.groupe_sanguin,
        up.nom as patient_nom,
        up.prenom as patient_prenom,
        up.email as patient_email,
        up.telephone as patient_telephone,
        up.date_naissance as patient_date_naissance,
        up.sexe as patient_sexe,
        um.nom as medecin_nom,
        um.prenom as medecin_prenom,
        um.specialite,
        a.motif as rdv_motif
      FROM consultations c
      INNER JOIN patients p ON c.patient_id = p.id
      INNER JOIN users up ON p.user_id = up.id
      INNER JOIN users um ON c.medecin_id = um.id
      LEFT JOIN appointments a ON c.appointment_id = a.id
      WHERE c.id = ?
    `;

    const result = await query(sql, [id]);
    const consultation = result && result.length > 0 ? result[0] : null;

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation non trouvée'
      });
    }

    // Récupérer les prescriptions associées
    const prescriptionsSql = `
      SELECT pr.*, 
        GROUP_CONCAT(
          CONCAT(pm.nom_medicament, '|', pm.dosage, '|', pm.posologie) 
          SEPARATOR ';;;'
        ) as medicaments
      FROM prescriptions pr
      LEFT JOIN prescription_medications pm ON pr.id = pm.prescription_id
      WHERE pr.consultation_id = ?
      GROUP BY pr.id
    `;
    const prescriptions = await query(prescriptionsSql, [id]);

    res.status(200).json({
      success: true,
      data: {
        ...consultation,
        prescriptions: prescriptions || []
      }
    });
  } catch (error) {
    console.error('Erreur getConsultationById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la consultation',
      error: error.message
    });
  }
};

// @desc    Créer une nouvelle consultation
// @route   POST /api/consultations
// @access  Private (medecin, infirmier)
exports.createConsultation = async (req, res) => {
  try {
    const {
      appointment_id,
      patient_id,
      date_consultation,
      motif_consultation,
      temperature,
      tension_arterielle_systolique,
      tension_arterielle_diastolique,
      frequence_cardiaque,
      frequence_respiratoire,
      poids,
      taille,
      saturation_oxygene,
      examen_clinique,
      symptomes,
      diagnostic,
      diagnostic_code_cim10,
      observations,
      examens_demandes,
      traitement_propose,
      conduite_a_tenir,
      prochain_rdv_recommande,
      arret_travail_jours
    } = req.body;

    const medecin_id = req.user.id;

    // Validation
    if (!patient_id || !date_consultation) {
      return res.status(400).json({
        success: false,
        message: 'Patient et date de consultation sont requis'
      });
    }

    // Calculer l'IMC si poids et taille sont fournis
    let imc = null;
    if (poids && taille) {
      const tailleEnMetres = taille / 100;
      imc = (poids / (tailleEnMetres * tailleEnMetres)).toFixed(2);
    }

    const sql = `
      INSERT INTO consultations (
        appointment_id, patient_id, medecin_id, date_consultation,
        motif_consultation, temperature, tension_arterielle_systolique,
        tension_arterielle_diastolique, frequence_cardiaque, frequence_respiratoire,
        poids, taille, imc, saturation_oxygene, examen_clinique,
        symptomes, diagnostic, diagnostic_code_cim10, observations,
        examens_demandes, traitement_propose, conduite_a_tenir,
        prochain_rdv_recommande, arret_travail_jours, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_cours')
    `;

    const result = await query(sql, [
      appointment_id || null,
      patient_id,
      medecin_id,
      date_consultation,
      motif_consultation,
      temperature,
      tension_arterielle_systolique,
      tension_arterielle_diastolique,
      frequence_cardiaque,
      frequence_respiratoire,
      poids,
      taille,
      imc,
      saturation_oxygene,
      examen_clinique,
      symptomes,
      diagnostic,
      diagnostic_code_cim10,
      observations,
      examens_demandes,
      traitement_propose,
      conduite_a_tenir,
      prochain_rdv_recommande,
      arret_travail_jours
    ]);

    // Mettre à jour le statut du rendez-vous si lié
    if (appointment_id) {
      await query(
        'UPDATE appointments SET statut = "en_cours" WHERE id = ?',
        [appointment_id]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Consultation créée avec succès',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Erreur createConsultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la consultation',
      error: error.message
    });
  }
};

// @desc    Mettre à jour une consultation
// @route   PUT /api/consultations/:id
// @access  Private (medecin)
exports.updateConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      motif_consultation,
      temperature,
      tension_arterielle_systolique,
      tension_arterielle_diastolique,
      frequence_cardiaque,
      frequence_respiratoire,
      poids,
      taille,
      saturation_oxygene,
      examen_clinique,
      symptomes,
      diagnostic,
      diagnostic_code_cim10,
      observations,
      examens_demandes,
      traitement_propose,
      conduite_a_tenir,
      prochain_rdv_recommande,
      arret_travail_jours,
      statut
    } = req.body;

    // Vérifier si la consultation existe
    const result = await query('SELECT id, medecin_id FROM consultations WHERE id = ?', [id]);
    const consultation = result && result.length > 0 ? result[0] : null;
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation non trouvée'
      });
    }

    // Vérifier que c'est bien le médecin de la consultation
    if (req.user.role === 'medecin' && consultation.medecin_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cette consultation'
      });
    }

    // Calculer l'IMC si poids et taille sont fournis
    let imc = null;
    if (poids && taille) {
      const tailleEnMetres = taille / 100;
      imc = (poids / (tailleEnMetres * tailleEnMetres)).toFixed(2);
    }

    const sql = `
      UPDATE consultations 
      SET motif_consultation = ?, temperature = ?, 
          tension_arterielle_systolique = ?, tension_arterielle_diastolique = ?,
          frequence_cardiaque = ?, frequence_respiratoire = ?,
          poids = ?, taille = ?, imc = ?, saturation_oxygene = ?,
          examen_clinique = ?, symptomes = ?, diagnostic = ?,
          diagnostic_code_cim10 = ?, observations = ?, examens_demandes = ?,
          traitement_propose = ?, conduite_a_tenir = ?,
          prochain_rdv_recommande = ?, arret_travail_jours = ?, statut = ?
      WHERE id = ?
    `;

    await query(sql, [
      motif_consultation,
      temperature,
      tension_arterielle_systolique,
      tension_arterielle_diastolique,
      frequence_cardiaque,
      frequence_respiratoire,
      poids,
      taille,
      imc,
      saturation_oxygene,
      examen_clinique,
      symptomes,
      diagnostic,
      diagnostic_code_cim10,
      observations,
      examens_demandes,
      traitement_propose,
      conduite_a_tenir,
      prochain_rdv_recommande,
      arret_travail_jours,
      statut,
      id
    ]);

    res.status(200).json({
      success: true,
      message: 'Consultation mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur updateConsultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la consultation',
      error: error.message
    });
  }
};

// @desc    Terminer une consultation
// @route   PUT /api/consultations/:id/terminer
// @access  Private (medecin)
exports.terminerConsultation = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la consultation existe
    const result = await query(
      'SELECT id, medecin_id, appointment_id FROM consultations WHERE id = ?',
      [id]
    );
    const consultation = result && result.length > 0 ? result[0] : null;

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation non trouvée'
      });
    }

    // Vérifier que c'est bien le médecin de la consultation
    if (consultation.medecin_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      });
    }

    // Mettre à jour le statut de la consultation
    await query('UPDATE consultations SET statut = "terminee" WHERE id = ?', [id]);

    // Mettre à jour le statut du rendez-vous si lié
    if (consultation.appointment_id) {
      await query(
        'UPDATE appointments SET statut = "termine" WHERE id = ?',
        [consultation.appointment_id]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Consultation terminée avec succès'
    });
  } catch (error) {
    console.error('Erreur terminerConsultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la finalisation de la consultation',
      error: error.message
    });
  }
};

// @desc    Supprimer une consultation
// @route   DELETE /api/consultations/:id
// @access  Private (admin uniquement)
exports.deleteConsultation = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la consultation existe
    const result = await query('SELECT id FROM consultations WHERE id = ?', [id]);
    const consultation = result && result.length > 0 ? result[0] : null;
    
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation non trouvée'
      });
    }

    // Supprimer la consultation (cascade supprimera les prescriptions liées)
    await query('DELETE FROM consultations WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Consultation supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteConsultation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la consultation',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques des consultations
// @route   GET /api/consultations/stats
// @access  Private (admin, medecin)
exports.getConsultationStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    let whereClause = '';
    const params = [];

    if (userRole === 'medecin') {
      whereClause = 'WHERE medecin_id = ?';
      params.push(userId);
    }

    // Total consultations
    const totalResult = await query(
      `SELECT COUNT(*) as total FROM consultations ${whereClause}`,
      params
    );
    const total = (totalResult && totalResult.length > 0) ? totalResult[0].total : 0;

    // Par statut
    const statusSql = `
      SELECT statut, COUNT(*) as count
      FROM consultations
      ${whereClause}
      GROUP BY statut
    `;
    const byStatus = await query(statusSql, params);

    // Consultations ce mois
    const thisMonthSql = `
      SELECT COUNT(*) as count
      FROM consultations
      ${whereClause ? whereClause + ' AND' : 'WHERE'} 
      MONTH(date_consultation) = MONTH(CURRENT_DATE())
      AND YEAR(date_consultation) = YEAR(CURRENT_DATE())
    `;
    const thisMonthResult = await query(thisMonthSql, params);
    const thisMonth = (thisMonthResult && thisMonthResult.length > 0) ? thisMonthResult[0].count : 0;

    // Consultations aujourd'hui
    const todaySql = `
      SELECT COUNT(*) as count
      FROM consultations
      ${whereClause ? whereClause + ' AND' : 'WHERE'} 
      DATE(date_consultation) = CURRENT_DATE()
    `;
    const todayResult = await query(todaySql, params);
    const today = (todayResult && todayResult.length > 0) ? todayResult[0].count : 0;

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus: byStatus || [],
        thisMonth,
        today
      }
    });
  } catch (error) {
    console.error('Erreur getConsultationStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// @desc    Obtenir l'historique des consultations d'un patient
// @route   GET /api/consultations/patient/:patientId/historique
// @access  Private (medecin, patient)
exports.getPatientConsultationHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const sql = `
      SELECT 
        c.*,
        um.nom as medecin_nom,
        um.prenom as medecin_prenom,
        um.specialite
      FROM consultations c
      INNER JOIN users um ON c.medecin_id = um.id
      WHERE c.patient_id = ?
      ORDER BY c.date_consultation DESC
    `;

    const consultations = await query(sql, [patientId]);

    res.status(200).json({
      success: true,
      data: consultations || []
    });
  } catch (error) {
    console.error('Erreur getPatientConsultationHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
};