const { query } = require('../config/database');

// @desc    Obtenir tous mes rendez-vous (médecin connecté)
// @route   GET /api/my-appointments
// @access  Private (medecin)
exports.getMyAppointments = async (req, res) => {
  try {
    const medecinId = req.user.id;
    const { 
      date, 
      statut, 
      search,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        a.id,
        a.date_heure,
        a.duree_minutes,
        a.statut,
        a.motif,
        a.type_consultation,
        a.notes,
        a.salle,
        p.numero_dossier,
        u.nom as patient_nom,
        u.prenom as patient_prenom,
        u.telephone as patient_telephone,
        u.date_naissance as patient_date_naissance,
        u.sexe as patient_sexe
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.id
      INNER JOIN users u ON p.user_id = u.id
      WHERE a.medecin_id = ?
    `;

    const params = [medecinId];

    // Filtrer par date
    if (date) {
      sql += ` AND DATE(a.date_heure) = ?`;
      params.push(date);
    }

    // Filtrer par statut
    if (statut) {
      sql += ` AND a.statut = ?`;
      params.push(statut);
    }

    // Recherche
    if (search) {
      sql += ` AND (
        u.nom LIKE ? OR 
        u.prenom LIKE ? OR 
        p.numero_dossier LIKE ? OR
        a.motif LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // ⭐ CORRECTION : Compter le total avec la bonne syntaxe
    const countSql = `
      SELECT COUNT(*) as total
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.id
      INNER JOIN users u ON p.user_id = u.id
      WHERE a.medecin_id = ?
      ${date ? 'AND DATE(a.date_heure) = ?' : ''}
      ${statut ? 'AND a.statut = ?' : ''}
      ${search ? `AND (
        u.nom LIKE ? OR 
        u.prenom LIKE ? OR 
        p.numero_dossier LIKE ? OR
        a.motif LIKE ?
      )` : ''}
    `;

    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0; // ⭐ Correction ici

    // Pagination
    sql += ` ORDER BY a.date_heure DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const appointments = await query(sql, params);

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur getMyAppointments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous',
      error: error.message
    });
  }
};

// @desc    Obtenir un rendez-vous spécifique
// @route   GET /api/my-appointments/:id
// @access  Private (medecin)
exports.getMyAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const medecinId = req.user.id;

    const sql = `
      SELECT 
        a.*,
        p.id as patient_id,
        p.numero_dossier,
        p.groupe_sanguin,
        p.contact_urgence_nom,
        p.contact_urgence_telephone,
        u.nom as patient_nom,
        u.prenom as patient_prenom,
        u.email as patient_email,
        u.telephone as patient_telephone,
        u.date_naissance as patient_date_naissance,
        u.sexe as patient_sexe,
        u.adresse as patient_adresse,
        mr.antecedents_medicaux,
        mr.allergies,
        mr.medicaments_actuels
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.id
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN medical_records mr ON p.id = mr.patient_id
      WHERE a.id = ? AND a.medecin_id = ?
    `;

    const result = await query(sql, [id, medecinId]);
    const appointment = result[0]; // ⭐ Correction

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Erreur getMyAppointmentById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du rendez-vous',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le statut d'un rendez-vous
// @route   PUT /api/my-appointments/:id/status
// @access  Private (medecin)
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    const medecinId = req.user.id;

    // Vérifier que le rendez-vous appartient au médecin
    const result = await query(
      'SELECT id FROM appointments WHERE id = ? AND medecin_id = ?',
      [id, medecinId]
    );

    const appointment = result[0]; // ⭐ Correction

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Mettre à jour le statut
    await query(
      'UPDATE appointments SET statut = ? WHERE id = ?',
      [statut, id]
    );

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur updateAppointmentStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

// @desc    Ajouter des notes à un rendez-vous
// @route   PUT /api/my-appointments/:id/notes
// @access  Private (medecin)
exports.addAppointmentNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const medecinId = req.user.id;

    // Vérifier que le rendez-vous appartient au médecin
    const result = await query(
      'SELECT id FROM appointments WHERE id = ? AND medecin_id = ?',
      [id, medecinId]
    );

    const appointment = result[0]; // ⭐ Correction

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Ajouter les notes
    await query(
      'UPDATE appointments SET notes = ? WHERE id = ?',
      [notes, id]
    );

    res.status(200).json({
      success: true,
      message: 'Notes ajoutées avec succès'
    });
  } catch (error) {
    console.error('Erreur addAppointmentNotes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout des notes',
      error: error.message
    });
  }
};
const { generateAppointmentPDF } = require('../utils/pdfGenerator');

// @desc    Télécharger le rendez-vous en PDF
// @route   GET /api/my-appointments/:id/pdf
// @access  Private (medecin)
exports.downloadAppointmentPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const medecinId = req.user.id;

    // Récupérer les détails du rendez-vous
    const sql = `
      SELECT 
        a.*,
        p.numero_dossier,
        u.nom as patient_nom,
        u.prenom as patient_prenom,
        u.telephone as patient_telephone,
        m.nom as medecin_nom,
        m.prenom as medecin_prenom,
        m.specialite
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.id
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN users m ON a.medecin_id = m.id
      WHERE a.id = ? AND a.medecin_id = ?
    `;

    const result = await query(sql, [id, medecinId]);
    const appointment = result[0];

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Générer le PDF
    const pdfInfo = await generateAppointmentPDF(appointment);

    // Envoyer le fichier
    res.download(pdfInfo.filePath, pdfInfo.fileName, (err) => {
      if (err) {
        console.error('Erreur téléchargement PDF:', err);
        res.status(500).json({
          success: false,
          message: 'Erreur lors du téléchargement'
        });
      }
    });
  } catch (error) {
    console.error('Erreur downloadAppointmentPDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: error.message
    });
  }
};