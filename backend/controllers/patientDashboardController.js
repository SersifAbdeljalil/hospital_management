const { query } = require('../config/database');

// @desc    Obtenir les statistiques du dashboard patient
// @route   GET /api/dashboard/patient/stats
// @access  Private (patient)
exports.getPatientStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Récupérer l'ID du patient depuis user_id
    const patientResult = await query(`
      SELECT id FROM patients WHERE user_id = ?
    `, [userId]);

    if (!patientResult || patientResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    const patientId = patientResult[0].id;

    // 2. Rendez-vous à venir
    const upcomingAppointmentsResult = await query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE patient_id = ?
      AND date_heure >= NOW()
      AND statut NOT IN ('annule', 'termine')
    `, [patientId]);
    const upcomingAppointments = (upcomingAppointmentsResult && upcomingAppointmentsResult.length > 0) 
      ? upcomingAppointmentsResult[0].count : 0;

    // 3. Rendez-vous ce mois
    const appointmentsMonthResult = await query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE patient_id = ?
      AND MONTH(date_heure) = MONTH(CURDATE())
      AND YEAR(date_heure) = YEAR(CURDATE())
      AND statut NOT IN ('annule')
    `, [patientId]);
    const appointmentsMonth = (appointmentsMonthResult && appointmentsMonthResult.length > 0) 
      ? appointmentsMonthResult[0].count : 0;

    // 4. Total rendez-vous (historique)
    const totalAppointmentsResult = await query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE patient_id = ?
    `, [patientId]);
    const totalAppointments = (totalAppointmentsResult && totalAppointmentsResult.length > 0) 
      ? totalAppointmentsResult[0].count : 0;

    // 5. Rendez-vous par statut
    const appointmentsByStatus = await query(`
      SELECT statut, COUNT(*) as count 
      FROM appointments 
      WHERE patient_id = ?
      AND date_heure >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY statut
    `, [patientId]);

    // 6. Ordonnances
    const totalPrescriptionsResult = await query(`
      SELECT COUNT(*) as count 
      FROM prescriptions 
      WHERE patient_id = ?
    `, [patientId]);
    const totalPrescriptions = (totalPrescriptionsResult && totalPrescriptionsResult.length > 0) 
      ? totalPrescriptionsResult[0].count : 0;

    // 7. Ordonnances en attente de paiement
    const pendingPrescriptionsResult = await query(`
      SELECT COUNT(*) as count 
      FROM prescriptions p
      LEFT JOIN invoices i ON p.consultation_id = (
        SELECT consultation_id FROM prescriptions WHERE id = p.id
      )
      WHERE p.patient_id = ?
      AND (i.statut_paiement IS NULL OR i.statut_paiement IN ('non_payee', 'partiellement_payee'))
      AND p.statut = 'active'
    `, [patientId]);
    const pendingPrescriptions = (pendingPrescriptionsResult && pendingPrescriptionsResult.length > 0) 
      ? pendingPrescriptionsResult[0].count : 0;

    // 8. Consultations totales
    const totalConsultationsResult = await query(`
      SELECT COUNT(*) as count 
      FROM consultations 
      WHERE patient_id = ?
    `, [patientId]);
    const totalConsultations = (totalConsultationsResult && totalConsultationsResult.length > 0) 
      ? totalConsultationsResult[0].count : 0;

    // 9. Dernière consultation
    const lastConsultationResult = await query(`
      SELECT 
        c.date_consultation,
        u.nom as medecin_nom,
        u.prenom as medecin_prenom,
        u.specialite,
        c.diagnostic
      FROM consultations c
      INNER JOIN users u ON c.medecin_id = u.id
      WHERE c.patient_id = ?
      ORDER BY c.date_consultation DESC
      LIMIT 1
    `, [patientId]);
    const lastConsultation = lastConsultationResult && lastConsultationResult.length > 0 
      ? lastConsultationResult[0] : null;

    // 10. Factures impayées
    const unpaidInvoicesResult = await query(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(montant_restant), 0) as montant_total
      FROM invoices 
      WHERE patient_id = ?
      AND statut_paiement IN ('non_payee', 'partiellement_payee')
    `, [patientId]);
    const unpaidInvoices = unpaidInvoicesResult && unpaidInvoicesResult.length > 0 
      ? {
          count: unpaidInvoicesResult[0].count,
          montant: parseFloat(unpaidInvoicesResult[0].montant_total || 0)
        }
      : { count: 0, montant: 0 };

    // 11. Total dépenses (factures payées)
    const totalSpentResult = await query(`
      SELECT COALESCE(SUM(montant_total), 0) as total
      FROM invoices
      WHERE patient_id = ?
      AND statut_paiement = 'payee'
    `, [patientId]);
    const totalSpent = (totalSpentResult && totalSpentResult.length > 0) 
      ? parseFloat(totalSpentResult[0].total || 0) : 0;

    // 12. Prochains rendez-vous (détails)
    const upcomingAppointmentsDetails = await query(`
      SELECT 
        a.id,
        a.date_heure,
        a.motif,
        a.statut,
        a.type_consultation,
        u.nom as medecin_nom,
        u.prenom as medecin_prenom,
        u.specialite,
        u.telephone as medecin_telephone
      FROM appointments a
      INNER JOIN users u ON a.medecin_id = u.id
      WHERE a.patient_id = ?
      AND a.date_heure >= NOW()
      AND a.statut NOT IN ('annule', 'termine')
      ORDER BY a.date_heure ASC
      LIMIT 5
    `, [patientId]);

    // 13. Historique récent des rendez-vous
    const recentAppointments = await query(`
      SELECT 
        a.id,
        a.date_heure,
        a.motif,
        a.statut,
        a.type_consultation,
        u.nom as medecin_nom,
        u.prenom as medecin_prenom,
        u.specialite
      FROM appointments a
      INNER JOIN users u ON a.medecin_id = u.id
      WHERE a.patient_id = ?
      AND a.date_heure < NOW()
      ORDER BY a.date_heure DESC
      LIMIT 5
    `, [patientId]);

    // 14. Ordonnances récentes
    const recentPrescriptions = await query(`
      SELECT 
        p.id,
        p.date_prescription,
        p.statut,
        u.nom as medecin_nom,
        u.prenom as medecin_prenom,
        u.specialite,
        c.diagnostic,
        i.statut_paiement,
        i.montant_total
      FROM prescriptions p
      INNER JOIN users u ON p.medecin_id = u.id
      LEFT JOIN consultations c ON p.consultation_id = c.id
      LEFT JOIN invoices i ON c.id = i.consultation_id
      WHERE p.patient_id = ?
      ORDER BY p.date_prescription DESC
      LIMIT 5
    `, [patientId]);

    // 15. Évolution des rendez-vous (6 derniers mois)
    const appointmentsTrend = await query(`
      SELECT 
        DATE_FORMAT(date_heure, '%Y-%m') as mois,
        COUNT(*) as count
      FROM appointments
      WHERE patient_id = ?
      AND date_heure >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      AND statut NOT IN ('annule')
      GROUP BY DATE_FORMAT(date_heure, '%Y-%m')
      ORDER BY mois ASC
    `, [patientId]);

    res.status(200).json({
      success: true,
      data: {
        appointments: {
          upcoming: upcomingAppointments,
          month: appointmentsMonth,
          total: totalAppointments,
          byStatus: appointmentsByStatus || [],
          upcomingDetails: upcomingAppointmentsDetails || [],
          recent: recentAppointments || [],
          trend: appointmentsTrend || []
        },
        prescriptions: {
          total: totalPrescriptions,
          pending: pendingPrescriptions,
          recent: recentPrescriptions || []
        },
        consultations: {
          total: totalConsultations,
          last: lastConsultation
        },
        invoices: {
          unpaid: unpaidInvoices,
          totalSpent: totalSpent
        }
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

// @desc    Obtenir le profil complet du patient
// @route   GET /api/dashboard/patient/profile
// @access  Private (patient)
exports.getPatientProfile = async (req, res) => {
  try {
    const userId = req.user.id;

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
        u.photo_profil,
        mr.antecedents_medicaux,
        mr.antecedents_chirurgicaux,
        mr.antecedents_familiaux,
        mr.allergies,
        mr.maladies_chroniques,
        mr.medicaments_actuels
      FROM patients p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN medical_records mr ON p.id = mr.patient_id
      WHERE u.id = ?
    `;

    const result = await query(sql, [userId]);
    
    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Profil patient non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('Erreur getPatientProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};