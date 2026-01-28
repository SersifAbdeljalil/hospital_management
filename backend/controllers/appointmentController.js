const { query } = require('../config/database');

// @desc    Obtenir tous les rendez-vous
// @route   GET /api/appointments
// @access  Private
exports.getAllAppointments = async (req, res) => {
  try {
    const { date_debut, date_fin, statut, patient_id, medecin_id } = req.query;

    let sql = `
      SELECT 
        a.id,
        a.date_heure,
        a.duree,
        a.motif,
        a.statut,
        a.notes,
        a.created_at,
        p.nom as patient_nom,
        p.prenom as patient_prenom,
        p.telephone as patient_telephone,
        pt.numero_dossier,
        m.nom as medecin_nom,
        m.prenom as medecin_prenom,
        m.specialite
      FROM appointments a
      INNER JOIN users p ON a.patient_id = p.id
      INNER JOIN patients pt ON pt.user_id = p.id
      INNER JOIN users m ON a.medecin_id = m.id
      WHERE 1=1
    `;

    const params = [];

    // Filtres
    if (date_debut && date_fin) {
      sql += ' AND DATE(a.date_heure) BETWEEN ? AND ?';
      params.push(date_debut, date_fin);
    }

    if (statut) {
      sql += ' AND a.statut = ?';
      params.push(statut);
    }

    if (patient_id) {
      sql += ' AND a.patient_id = ?';
      params.push(patient_id);
    }

    if (medecin_id) {
      sql += ' AND a.medecin_id = ?';
      params.push(medecin_id);
    }

    // Filtrer selon le rôle
    if (req.user.role === 'patient') {
      sql += ' AND a.patient_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'medecin') {
      sql += ' AND a.medecin_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY a.date_heure ASC';

    const appointments = await query(sql, params);

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Erreur getAllAppointments:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous',
      error: error.message
    });
  }
};

// @desc    Obtenir un rendez-vous par ID
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        a.*,
        p.nom as patient_nom,
        p.prenom as patient_prenom,
        p.email as patient_email,
        p.telephone as patient_telephone,
        pt.numero_dossier,
        pt.groupe_sanguin,
        m.nom as medecin_nom,
        m.prenom as medecin_prenom,
        m.specialite,
        m.email as medecin_email
      FROM appointments a
      INNER JOIN users p ON a.patient_id = p.id
      INNER JOIN patients pt ON pt.user_id = p.id
      INNER JOIN users m ON a.medecin_id = m.id
      WHERE a.id = ?
    `;

    const [appointment] = await query(sql, [id]);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'patient' && appointment.patient_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    if (req.user.role === 'medecin' && appointment.medecin_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Erreur getAppointmentById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du rendez-vous',
      error: error.message
    });
  }
};

// @desc    Créer un rendez-vous
// @route   POST /api/appointments
// @access  Private
exports.createAppointment = async (req, res) => {
  try {
    const {
      patient_id,
      medecin_id,
      date_heure,
      duree = 30,
      motif,
      notes
    } = req.body;

    // Validation
    if (!patient_id || !medecin_id || !date_heure) {
      return res.status(400).json({
        success: false,
        message: 'Patient, médecin et date/heure sont requis'
      });
    }

    // Vérifier que la date n'est pas dans le passé
    const appointmentDate = new Date(date_heure);
    if (appointmentDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'La date du rendez-vous ne peut pas être dans le passé'
      });
    }

    // Vérifier la disponibilité du médecin
    const checkSql = `
      SELECT id FROM appointments 
      WHERE medecin_id = ? 
      AND DATE(date_heure) = DATE(?)
      AND statut NOT IN ('annule', 'termine')
      AND (
        (date_heure <= ? AND DATE_ADD(date_heure, INTERVAL duree MINUTE) > ?) OR
        (date_heure < DATE_ADD(?, INTERVAL ? MINUTE) AND date_heure >= ?)
      )
    `;

    const conflicts = await query(checkSql, [
      medecin_id,
      date_heure,
      date_heure,
      date_heure,
      date_heure,
      duree,
      date_heure
    ]);

    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ce créneau horaire n\'est pas disponible'
      });
    }

    // Créer le rendez-vous
    const insertSql = `
      INSERT INTO appointments (patient_id, medecin_id, date_heure, duree, motif, notes, statut)
      VALUES (?, ?, ?, ?, ?, ?, 'planifie')
    `;

    const result = await query(insertSql, [
      patient_id,
      medecin_id,
      date_heure,
      duree,
      motif,
      notes
    ]);

    res.status(201).json({
      success: true,
      message: 'Rendez-vous créé avec succès',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('Erreur createAppointment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du rendez-vous',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un rendez-vous
// @route   PUT /api/appointments/:id
// @access  Private
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date_heure,
      duree,
      motif,
      notes,
      statut
    } = req.body;

    // Vérifier que le rendez-vous existe
    const [existing] = await query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Si modification de date/heure, vérifier la disponibilité
    if (date_heure && date_heure !== existing.date_heure) {
      const appointmentDate = new Date(date_heure);
      if (appointmentDate < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'La date du rendez-vous ne peut pas être dans le passé'
        });
      }

      const checkSql = `
        SELECT id FROM appointments 
        WHERE medecin_id = ? 
        AND id != ?
        AND DATE(date_heure) = DATE(?)
        AND statut NOT IN ('annule', 'termine')
        AND (
          (date_heure <= ? AND DATE_ADD(date_heure, INTERVAL duree MINUTE) > ?) OR
          (date_heure < DATE_ADD(?, INTERVAL ? MINUTE) AND date_heure >= ?)
        )
      `;

      const conflicts = await query(checkSql, [
        existing.medecin_id,
        id,
        date_heure,
        date_heure,
        date_heure,
        date_heure,
        duree || existing.duree,
        date_heure
      ]);

      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ce créneau horaire n\'est pas disponible'
        });
      }
    }

    // Mettre à jour
    const updateSql = `
      UPDATE appointments 
      SET date_heure = COALESCE(?, date_heure),
          duree = COALESCE(?, duree),
          motif = COALESCE(?, motif),
          notes = COALESCE(?, notes),
          statut = COALESCE(?, statut)
      WHERE id = ?
    `;

    await query(updateSql, [
      date_heure || null,
      duree || null,
      motif || null,
      notes || null,
      statut || null,
      id
    ]);

    res.status(200).json({
      success: true,
      message: 'Rendez-vous mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur updateAppointment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du rendez-vous',
      error: error.message
    });
  }
};

// @desc    Annuler un rendez-vous
// @route   DELETE /api/appointments/:id
// @access  Private
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Rendez-vous non trouvé'
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'patient' && existing.patient_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez annuler que vos propres rendez-vous'
      });
    }

    // Mettre le statut à "annule" au lieu de supprimer
    await query('UPDATE appointments SET statut = ? WHERE id = ?', ['annule', id]);

    res.status(200).json({
      success: true,
      message: 'Rendez-vous annulé avec succès'
    });
  } catch (error) {
    console.error('Erreur cancelAppointment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation du rendez-vous',
      error: error.message
    });
  }
};

// @desc    Obtenir les créneaux disponibles d'un médecin
// @route   GET /api/appointments/availability/:medecin_id
// @access  Private
exports.getAvailability = async (req, res) => {
  try {
    const { medecin_id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'La date est requise'
      });
    }

    // Récupérer tous les RDV du médecin pour cette date
    const sql = `
      SELECT date_heure, duree 
      FROM appointments 
      WHERE medecin_id = ? 
      AND DATE(date_heure) = DATE(?)
      AND statut NOT IN ('annule')
      ORDER BY date_heure ASC
    `;

    const bookedSlots = await query(sql, [medecin_id, date]);

    // Générer les créneaux disponibles (8h-18h par intervalles de 30 min)
    const slots = [];
    const startHour = 8;
    const endHour = 18;
    const slotDuration = 30;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotTime = `${date} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
        
        // Vérifier si ce créneau est libre
        const isBooked = bookedSlots.some(booking => {
          const bookingStart = new Date(booking.date_heure);
          const bookingEnd = new Date(bookingStart.getTime() + booking.duree * 60000);
          const slotStart = new Date(slotTime);
          const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          );
        });

        if (!isBooked) {
          slots.push({
            time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
            datetime: slotTime,
            available: true
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      date,
      medecin_id,
      slots
    });
  } catch (error) {
    console.error('Erreur getAvailability:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des disponibilités',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques des rendez-vous
// @route   GET /api/appointments/stats
// @access  Private (admin, medecin)
exports.getAppointmentStats = async (req, res) => {
  try {
    // Total RDV
    const [totalResult] = await query('SELECT COUNT(*) as total FROM appointments');
    
    // Par statut
    const byStatus = await query(`
      SELECT statut, COUNT(*) as count 
      FROM appointments 
      GROUP BY statut
    `);

    // RDV aujourd'hui
    const [todayResult] = await query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE DATE(date_heure) = CURDATE()
    `);

    // RDV ce mois
    const [thisMonthResult] = await query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE MONTH(date_heure) = MONTH(CURDATE())
      AND YEAR(date_heure) = YEAR(CURDATE())
    `);

    res.status(200).json({
      success: true,
      data: {
        total: totalResult.total,
        byStatus,
        today: todayResult.count,
        thisMonth: thisMonthResult.count
      }
    });
  } catch (error) {
    console.error('Erreur getAppointmentStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};