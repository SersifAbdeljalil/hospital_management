const { query } = require('../config/database');

// @desc    Obtenir les statistiques du dashboard admin
// @route   GET /api/dashboard/admin/stats
// @access  Private (admin)
exports.getAdminStats = async (req, res) => {
  try {
    // 1. Total utilisateurs par rôle
    const usersByRole = await query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE statut = 'actif'
      GROUP BY role
    `);

    // 2. Total patients
    const totalPatientsResult = await query(`
      SELECT COUNT(*) as count FROM patients
    `);
    const totalPatients = (totalPatientsResult && totalPatientsResult.length > 0) ? totalPatientsResult[0].count : 0;

    // 3. Rendez-vous par statut
    const appointmentsByStatus = await query(`
      SELECT statut, COUNT(*) as count 
      FROM appointments 
      GROUP BY statut
    `);

    // 4. Rendez-vous aujourd'hui
    const appointmentsTodayResult = await query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE DATE(date_heure) = CURDATE()
      AND statut NOT IN ('annule')
    `);
    const appointmentsToday = (appointmentsTodayResult && appointmentsTodayResult.length > 0) ? appointmentsTodayResult[0].count : 0;

    // 5. Rendez-vous cette semaine
    const appointmentsWeekResult = await query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE YEARWEEK(date_heure, 1) = YEARWEEK(CURDATE(), 1)
      AND statut NOT IN ('annule')
    `);
    const appointmentsWeek = (appointmentsWeekResult && appointmentsWeekResult.length > 0) ? appointmentsWeekResult[0].count : 0;

    // 6. Rendez-vous ce mois
    const appointmentsMonthResult = await query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE MONTH(date_heure) = MONTH(CURDATE())
      AND YEAR(date_heure) = YEAR(CURDATE())
      AND statut NOT IN ('annule')
    `);
    const appointmentsMonth = (appointmentsMonthResult && appointmentsMonthResult.length > 0) ? appointmentsMonthResult[0].count : 0;

    // 7. Nouveaux patients ce mois
    const newPatientsMonthResult = await query(`
      SELECT COUNT(*) as count 
      FROM patients 
      WHERE MONTH(created_at) = MONTH(CURDATE())
      AND YEAR(created_at) = YEAR(CURDATE())
    `);
    const newPatientsMonth = (newPatientsMonthResult && newPatientsMonthResult.length > 0) ? newPatientsMonthResult[0].count : 0;

    // 8. Consultations ce mois
    const consultationsMonthResult = await query(`
      SELECT COUNT(*) as count 
      FROM consultations 
      WHERE MONTH(date_consultation) = MONTH(CURDATE())
      AND YEAR(date_consultation) = YEAR(CURDATE())
    `);
    const consultationsMonth = (consultationsMonthResult && consultationsMonthResult.length > 0) ? consultationsMonthResult[0].count : 0;

    // 9. Revenus ce mois (table invoices)
    const revenueMonthResult = await query(`
      SELECT COALESCE(SUM(montant_total), 0) as total
      FROM invoices
      WHERE MONTH(date_emission) = MONTH(CURDATE())
      AND YEAR(date_emission) = YEAR(CURDATE())
      AND statut_paiement = 'payee'
    `);
    const revenueMonth = (revenueMonthResult && revenueMonthResult.length > 0) ? parseFloat(revenueMonthResult[0].total || 0) : 0;

    // 10. Patients par groupe sanguin
    const patientsByBloodGroup = await query(`
      SELECT groupe_sanguin, COUNT(*) as count 
      FROM patients 
      WHERE groupe_sanguin IS NOT NULL
      GROUP BY groupe_sanguin
      ORDER BY count DESC
    `);

    // 11. Rendez-vous par médecin (top 5)
    const appointmentsByDoctor = await query(`
      SELECT 
        u.nom,
        u.prenom,
        u.specialite,
        COUNT(a.id) as count
      FROM appointments a
      INNER JOIN users u ON a.medecin_id = u.id
      WHERE MONTH(a.date_heure) = MONTH(CURDATE())
      AND YEAR(a.date_heure) = YEAR(CURDATE())
      AND a.statut NOT IN ('annule')
      GROUP BY a.medecin_id, u.nom, u.prenom, u.specialite
      ORDER BY count DESC
      LIMIT 5
    `);

    // 12. Évolution des rendez-vous (7 derniers jours)
    const appointmentsTrend = await query(`
      SELECT 
        DATE(date_heure) as date,
        COUNT(*) as count
      FROM appointments
      WHERE date_heure >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      AND statut NOT IN ('annule')
      GROUP BY DATE(date_heure)
      ORDER BY date ASC
    `);

    // 13. Prochains rendez-vous (5 prochains)
    const upcomingAppointments = await query(`
      SELECT 
        a.id,
        a.date_heure,
        a.motif,
        a.statut,
        up.nom as patient_nom,
        up.prenom as patient_prenom,
        um.nom as medecin_nom,
        um.prenom as medecin_prenom,
        um.specialite
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.id
      INNER JOIN users up ON p.user_id = up.id
      INNER JOIN users um ON a.medecin_id = um.id
      WHERE a.date_heure >= NOW()
      AND a.statut NOT IN ('annule', 'termine')
      ORDER BY a.date_heure ASC
      LIMIT 5
    `);

    // 14. Dernières activités (créations de patients récentes)
    const recentActivities = await query(`
      SELECT 
        u.nom,
        u.prenom,
        p.numero_dossier,
        p.created_at
      FROM patients p
      INNER JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    res.status(200).json({
      success: true,
      data: {
        users: {
          byRole: usersByRole || [],
          totalPatients
        },
        appointments: {
          byStatus: appointmentsByStatus || [],
          today: appointmentsToday,
          week: appointmentsWeek,
          month: appointmentsMonth,
          trend: appointmentsTrend || [],
          byDoctor: appointmentsByDoctor || [],
          upcoming: upcomingAppointments || []
        },
        patients: {
          newThisMonth: newPatientsMonth,
          byBloodGroup: patientsByBloodGroup || []
        },
        consultations: {
          month: consultationsMonth
        },
        revenue: {
          month: revenueMonth
        },
        recentActivities: recentActivities || []
      }
    });
  } catch (error) {
    console.error('Erreur getAdminStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques du dashboard médecin
// @route   GET /api/dashboard/doctor/stats
// @access  Private (medecin)
exports.getDoctorStats = async (req, res) => {
  try {
    const medecinId = req.user.id;

    // 1. Rendez-vous aujourd'hui
    const appointmentsTodayResult = await query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE medecin_id = ?
      AND DATE(date_heure) = CURDATE()
      AND statut NOT IN ('annule')
    `, [medecinId]);
    const appointmentsToday = (appointmentsTodayResult && appointmentsTodayResult.length > 0) ? appointmentsTodayResult[0].count : 0;

    // 2. Rendez-vous cette semaine
    const appointmentsWeekResult = await query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE medecin_id = ?
      AND YEARWEEK(date_heure, 1) = YEARWEEK(CURDATE(), 1)
      AND statut NOT IN ('annule')
    `, [medecinId]);
    const appointmentsWeek = (appointmentsWeekResult && appointmentsWeekResult.length > 0) ? appointmentsWeekResult[0].count : 0;

    // 3. Rendez-vous par statut
    const appointmentsByStatus = await query(`
      SELECT statut, COUNT(*) as count 
      FROM appointments 
      WHERE medecin_id = ?
      AND MONTH(date_heure) = MONTH(CURDATE())
      AND YEAR(date_heure) = YEAR(CURDATE())
      GROUP BY statut
    `, [medecinId]);

    // 4. Total patients suivis
    const totalPatientsResult = await query(`
      SELECT COUNT(DISTINCT patient_id) as count 
      FROM appointments 
      WHERE medecin_id = ?
    `, [medecinId]);
    const totalPatients = (totalPatientsResult && totalPatientsResult.length > 0) ? totalPatientsResult[0].count : 0;

    // 5. Consultations ce mois
    const consultationsMonthResult = await query(`
      SELECT COUNT(*) as count 
      FROM consultations 
      WHERE medecin_id = ?
      AND MONTH(date_consultation) = MONTH(CURDATE())
      AND YEAR(date_consultation) = YEAR(CURDATE())
    `, [medecinId]);
    const consultationsMonth = (consultationsMonthResult && consultationsMonthResult.length > 0) ? consultationsMonthResult[0].count : 0;

    // 6. Consultations aujourd'hui
    const consultationsTodayResult = await query(`
      SELECT COUNT(*) as count 
      FROM consultations 
      WHERE medecin_id = ?
      AND DATE(date_consultation) = CURDATE()
    `, [medecinId]);
    const consultationsToday = (consultationsTodayResult && consultationsTodayResult.length > 0) ? consultationsTodayResult[0].count : 0;

    // 7. Consultations par type
    const consultationsByType = await query(`
      SELECT a.type_consultation as type, COUNT(*) as count
      FROM consultations c
      INNER JOIN appointments a ON c.appointment_id = a.id
      WHERE c.medecin_id = ?
      AND MONTH(c.date_consultation) = MONTH(CURDATE())
      AND YEAR(c.date_consultation) = YEAR(CURDATE())
      GROUP BY a.type_consultation
    `, [medecinId]);

    // 8. Évolution des consultations (7 derniers jours)
    const consultationsTrend = await query(`
      SELECT 
        DATE(date_consultation) as date,
        COUNT(*) as count
      FROM consultations
      WHERE medecin_id = ?
      AND date_consultation >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(date_consultation)
      ORDER BY date ASC
    `, [medecinId]);

    // 9. Ordonnances ce mois
    const prescriptionsMonthResult = await query(`
      SELECT COUNT(*) as count 
      FROM prescriptions 
      WHERE medecin_id = ?
      AND MONTH(date_prescription) = MONTH(CURDATE())
      AND YEAR(date_prescription) = YEAR(CURDATE())
    `, [medecinId]);
    const prescriptionsMonth = (prescriptionsMonthResult && prescriptionsMonthResult.length > 0) ? prescriptionsMonthResult[0].count : 0;

    // 10. Total ordonnances
    const prescriptionsTotalResult = await query(`
      SELECT COUNT(*) as count 
      FROM prescriptions 
      WHERE medecin_id = ?
    `, [medecinId]);
    const prescriptionsTotal = (prescriptionsTotalResult && prescriptionsTotalResult.length > 0) ? prescriptionsTotalResult[0].count : 0;

    // 11. Prochains rendez-vous
    const upcomingAppointments = await query(`
      SELECT 
        a.id,
        a.date_heure,
        a.motif,
        a.statut,
        up.nom as patient_nom,
        up.prenom as patient_prenom,
        p.numero_dossier
      FROM appointments a
      INNER JOIN patients p ON a.patient_id = p.id
      INNER JOIN users up ON p.user_id = up.id
      WHERE a.medecin_id = ?
      AND a.date_heure >= NOW()
      AND a.statut NOT IN ('annule', 'termine')
      ORDER BY a.date_heure ASC
      LIMIT 5
    `, [medecinId]);

    // 12. Patients récents
    const recentPatients = await query(`
      SELECT DISTINCT
        up.nom,
        up.prenom,
        p.numero_dossier,
        MAX(c.date_consultation) as last_consultation
      FROM consultations c
      INNER JOIN patients p ON c.patient_id = p.id
      INNER JOIN users up ON p.user_id = up.id
      WHERE c.medecin_id = ?
      GROUP BY p.id, up.nom, up.prenom, p.numero_dossier
      ORDER BY last_consultation DESC
      LIMIT 5
    `, [medecinId]);

    res.status(200).json({
      success: true,
      data: {
        appointments: {
          today: appointmentsToday,
          week: appointmentsWeek,
          byStatus: appointmentsByStatus || [],
          upcoming: upcomingAppointments || []
        },
        patients: {
          total: totalPatients,
          recent: recentPatients || []
        },
        consultations: {
          today: consultationsToday,
          month: consultationsMonth,
          byType: consultationsByType || [],
          trend: consultationsTrend || []
        },
        prescriptions: {
          total: prescriptionsTotal,
          month: prescriptionsMonth
        }
      }
    });
  } catch (error) {
    console.error('Erreur getDoctorStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques rapides
// @route   GET /api/dashboard/quick-stats
// @access  Private
exports.getQuickStats = async (req, res) => {
  try {
    const { role } = req.user;

    let stats = {};

    if (role === 'admin') {
      // Stats admin
      const patientsResult = await query('SELECT COUNT(*) as count FROM patients');
      const patients = (patientsResult && patientsResult.length > 0) ? patientsResult[0].count : 0;

      const appointmentsResult = await query('SELECT COUNT(*) as count FROM appointments WHERE DATE(date_heure) = CURDATE()');
      const appointments = (appointmentsResult && appointmentsResult.length > 0) ? appointmentsResult[0].count : 0;

      const usersResult = await query('SELECT COUNT(*) as count FROM users WHERE statut = "actif"');
      const users = (usersResult && usersResult.length > 0) ? usersResult[0].count : 0;

      stats = {
        totalPatients: patients,
        appointmentsToday: appointments,
        activeUsers: users
      };
    } else if (role === 'medecin') {
      // Stats médecin
      const appointmentsResult = await query(
        'SELECT COUNT(*) as count FROM appointments WHERE medecin_id = ? AND DATE(date_heure) = CURDATE()',
        [req.user.id]
      );
      const appointments = (appointmentsResult && appointmentsResult.length > 0) ? appointmentsResult[0].count : 0;

      const patientsResult = await query(
        'SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE medecin_id = ?',
        [req.user.id]
      );
      const patients = (patientsResult && patientsResult.length > 0) ? patientsResult[0].count : 0;

      stats = {
        appointmentsToday: appointments,
        totalPatients: patients
      };
    } else if (role === 'patient') {
      // Stats patient
      const appointmentsResult = await query(
        'SELECT COUNT(*) as count FROM appointments WHERE patient_id = ? AND date_heure >= NOW()',
        [req.user.id]
      );
      const appointments = (appointmentsResult && appointmentsResult.length > 0) ? appointmentsResult[0].count : 0;

      stats = {
        upcomingAppointments: appointments
      };
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erreur getQuickStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};