const { query } = require('../config/database');
const { generatePrescriptionPDF } = require('../utils/prescriptionPdfGenerator');
const { createNotification } = require('./notificationController');

// @desc    Créer une nouvelle ordonnance
// @route   POST /api/prescriptions
// @access  Private (medecin)
exports.createPrescription = async (req, res) => {
  try {
    const medecinId = req.user.id;
    const {
      patient_id,
      consultation_id,
      diagnostic,
      medicaments,
      instructions,
      duree_traitement
    } = req.body;

    console.log('📦 Données reçues:', { patient_id, diagnostic, medicaments });

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: 'patient_id est requis'
      });
    }

    if (!diagnostic) {
      return res.status(400).json({
        success: false,
        message: 'diagnostic est requis'
      });
    }

    if (!medicaments || !Array.isArray(medicaments) || medicaments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un médicament est requis'
      });
    }

    // Vérifier que le patient existe
    const patientCheck = await query(
      `SELECT p.id, p.user_id, u.nom, u.prenom, u.email 
       FROM patients p 
       INNER JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [patient_id]
    );

    if (!patientCheck || patientCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    const patient = patientCheck[0];

    // Vérifier la consultation si fournie
    if (consultation_id) {
      const consultationCheck = await query(
        'SELECT id FROM consultations WHERE id = ? AND medecin_id = ? AND patient_id = ?',
        [consultation_id, medecinId, patient_id]
      );

      if (consultationCheck.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Consultation non trouvée'
        });
      }
    }

    // Générer le numéro d'ordonnance unique
    const numeroOrdonnance = `ORD-${Date.now()}-${medecinId}`;

    // Insérer l'ordonnance
    const result = await query(
      `INSERT INTO prescriptions 
       (numero_ordonnance, medecin_id, patient_id, consultation_id, diagnostic, 
        medicaments, instructions, duree_traitement, statut, date_creation, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en_attente', NOW(), NOW())`,
      [
        numeroOrdonnance,
        medecinId,
        patient_id,
        consultation_id || null,
        diagnostic,
        JSON.stringify(medicaments),
        instructions || null,
        duree_traitement || null
      ]
    );

    const prescriptionId = result.insertId;

    // Créer une notification pour le patient
    try {
      const doctorName = req.user.prenom && req.user.nom 
        ? `${req.user.prenom} ${req.user.nom}`
        : 'Votre médecin';

      await createNotification(
        patient.user_id,
        'prescription_created',
        'Nouvelle Ordonnance',
        `Le Dr. ${doctorName} vous a prescrit une nouvelle ordonnance. Paiement requis pour télécharger.`,
        prescriptionId,
        req.user.id
      );
    } catch (notifError) {
      console.error('⚠️ Erreur notification patient:', notifError.message);
    }

    // ⚠️ CORRECTION: Requête SQL simplifiée sans colonnes qui peuvent ne pas exister
    const prescription = await query(
      `SELECT 
        pr.*,
        u.nom as medecin_nom,
        u.prenom as medecin_prenom,
        u.telephone as medecin_telephone,
        p.numero_dossier,
        pat.nom as patient_nom,
        pat.prenom as patient_prenom,
        pat.date_naissance as patient_date_naissance,
        pat.sexe as patient_sexe
       FROM prescriptions pr
       INNER JOIN users u ON pr.medecin_id = u.id
       INNER JOIN patients p ON pr.patient_id = p.id
       INNER JOIN users pat ON p.user_id = pat.id
       WHERE pr.id = ?`,
      [prescriptionId]
    );

    if (!prescription || prescription.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Ordonnance créée mais impossible de la récupérer'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Ordonnance créée avec succès',
      data: {
        ...prescription[0],
        medicaments: JSON.parse(prescription[0].medicaments)
      }
    });
  } catch (error) {
    console.error('❌ Erreur createPrescription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'ordonnance',
      error: error.message
    });
  }
};

// @desc    Obtenir toutes les ordonnances du médecin
// @route   GET /api/prescriptions
// @access  Private (medecin)
// Remplacez juste cette partie dans getDoctorPrescriptions (ligne ~206-218):

exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const medecinId = req.user.id;
    const { statut, patient_id, date_debut, date_fin } = req.query;

    let sql = `
      SELECT 
        pr.*,
        p.numero_dossier,
        u.nom as patient_nom,
        u.prenom as patient_prenom
      FROM prescriptions pr
      INNER JOIN patients p ON pr.patient_id = p.id
      INNER JOIN users u ON p.user_id = u.id
      WHERE pr.medecin_id = ?
    `;

    const params = [medecinId];

    if (statut) {
      sql += ' AND pr.statut = ?';
      params.push(statut);
    }

    if (patient_id) {
      sql += ' AND pr.patient_id = ?';
      params.push(patient_id);
    }

    if (date_debut) {
      sql += ' AND DATE(pr.date_creation) >= ?';
      params.push(date_debut);
    }

    if (date_fin) {
      sql += ' AND DATE(pr.date_creation) <= ?';
      params.push(date_fin);
    }

    sql += ' ORDER BY pr.id DESC';

    const prescriptions = await query(sql, params);

    // ✅ CORRECTION: Parser les médicaments JSON de manière robuste
    const formattedPrescriptions = prescriptions.map(pr => {
      let medicaments = [];
      
      try {
        if (pr.medicaments) {
          // Si c'est déjà un objet (pas une string)
          if (typeof pr.medicaments === 'object') {
            medicaments = pr.medicaments;
          } else {
            // Si c'est une string, parser
            medicaments = JSON.parse(pr.medicaments);
          }
        }
      } catch (e) {
        console.error('Erreur parsing medicaments pour prescription', pr.id, ':', e.message);
        medicaments = [];
      }

      return {
        ...pr,
        medicaments: medicaments
      };
    });

    res.status(200).json({
      success: true,
      data: formattedPrescriptions
    });
  } catch (error) {
    console.error('Erreur getDoctorPrescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ordonnances',
      error: error.message
    });
  }
};

// @desc    Obtenir les ordonnances du patient connecté
// @route   GET /api/prescriptions/my-prescriptions
// @access  Private (patient)
exports.getMyPrescriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const patientResult = await query(
      'SELECT id FROM patients WHERE user_id = ?',
      [userId]
    );

    if (patientResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    const patientId = patientResult[0].id;

    const prescriptions = await query(
      `SELECT 
        pr.*,
        u.nom as medecin_nom,
        u.prenom as medecin_prenom,
        inv.montant_total,
        inv.montant_paye,
        inv.statut_paiement as paiement_statut
      FROM prescriptions pr
      INNER JOIN users u ON pr.medecin_id = u.id
      LEFT JOIN invoices inv ON pr.invoice_id = inv.id
      WHERE pr.patient_id = ?
      ORDER BY pr.created_at DESC`,
      [patientId]
    );

    const formattedPrescriptions = prescriptions.map(pr => ({
      ...pr,
      medicaments: JSON.parse(pr.medicaments || '[]'),
      peut_telecharger: pr.statut === 'payee'
    }));

    res.status(200).json({
      success: true,
      data: formattedPrescriptions
    });
  } catch (error) {
    console.error('Erreur getMyPrescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ordonnances',
      error: error.message
    });
  }
};

// @desc    Obtenir une ordonnance par ID
// @route   GET /api/prescriptions/:id
// @access  Private (medecin/patient)
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT 
        pr.*,
        med.nom as medecin_nom,
        med.prenom as medecin_prenom,
        med.telephone as medecin_telephone,
        p.numero_dossier,
        pat.nom as patient_nom,
        pat.prenom as patient_prenom,
        pat.date_naissance as patient_date_naissance,
        pat.sexe as patient_sexe,
        pat.telephone as patient_telephone,
        inv.montant_total,
        inv.montant_paye,
        inv.statut_paiement as paiement_statut
      FROM prescriptions pr
      INNER JOIN users med ON pr.medecin_id = med.id
      INNER JOIN patients p ON pr.patient_id = p.id
      INNER JOIN users pat ON p.user_id = pat.id
      LEFT JOIN invoices inv ON pr.invoice_id = inv.id
      WHERE pr.id = ?
    `;

    const params = [id];

    if (userRole === 'medecin') {
      sql += ' AND pr.medecin_id = ?';
      params.push(userId);
    } else if (userRole === 'patient') {
      sql += ' AND p.user_id = ?';
      params.push(userId);
    }

    const result = await query(sql, params);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    const prescription = {
      ...result[0],
      medicaments: JSON.parse(result[0].medicaments || '[]')
    };

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Erreur getPrescriptionById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'ordonnance',
      error: error.message
    });
  }
};

// @desc    Générer et télécharger le PDF de l'ordonnance
// @route   GET /api/prescriptions/:id/pdf
// @access  Private (medecin/patient avec paiement)
exports.downloadPrescriptionPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let sql = `
      SELECT 
        pr.*,
        med.nom as medecin_nom,
        med.prenom as medecin_prenom,
        med.telephone as medecin_telephone,
        p.numero_dossier,
        pat.nom as patient_nom,
        pat.prenom as patient_prenom,
        pat.date_naissance as patient_date_naissance,
        pat.sexe as patient_sexe,
        pat.telephone as patient_telephone,
        inv.statut_paiement as paiement_statut
      FROM prescriptions pr
      INNER JOIN users med ON pr.medecin_id = med.id
      INNER JOIN patients p ON pr.patient_id = p.id
      INNER JOIN users pat ON p.user_id = pat.id
      LEFT JOIN invoices inv ON pr.invoice_id = inv.id
      WHERE pr.id = ?
    `;

    const params = [id];

    if (userRole === 'medecin') {
      sql += ' AND pr.medecin_id = ?';
      params.push(userId);
    } else if (userRole === 'patient') {
      sql += ' AND p.user_id = ?';
      params.push(userId);
    }

    const result = await query(sql, params);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    const prescription = result[0];

    if (userRole === 'patient' && prescription.statut !== 'payee') {
      return res.status(403).json({
        success: false,
        message: 'Paiement requis pour télécharger l\'ordonnance'
      });
    }

    prescription.medicaments = JSON.parse(prescription.medicaments || '[]');

    const pdfInfo = await generatePrescriptionPDF(prescription);

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
    console.error('Erreur downloadPrescriptionPDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du PDF',
      error: error.message
    });
  }
};

// @desc    Créer une facture pour une ordonnance
// @route   POST /api/prescriptions/:id/invoice
// @access  Private (medecin)
exports.createPrescriptionInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const medecinId = req.user.id;
    const { montant } = req.body;

    const prescriptionResult = await query(
      `SELECT pr.*, p.user_id as patient_user_id
       FROM prescriptions pr
       INNER JOIN patients p ON pr.patient_id = p.id
       WHERE pr.id = ? AND pr.medecin_id = ?`,
      [id, medecinId]
    );

    if (prescriptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    const prescription = prescriptionResult[0];

    if (prescription.invoice_id) {
      return res.status(400).json({
        success: false,
        message: 'Une facture existe déjà pour cette ordonnance'
      });
    }

    const numeroFacture = `INV-ORD-${Date.now()}`;
    
    const invoiceResult = await query(
      `INSERT INTO invoices 
       (numero_facture, patient_id, montant_total, montant_paye, statut, 
        description, type, date_emission)
       VALUES (?, ?, ?, 0, 'non_payee', ?, 'ordonnance', NOW())`,
      [
        numeroFacture,
        prescription.patient_id,
        montant,
        `Ordonnance N° ${prescription.numero_ordonnance}`
      ]
    );

    const invoiceId = invoiceResult.insertId;

    await query(
      'UPDATE prescriptions SET invoice_id = ? WHERE id = ?',
      [invoiceId, id]
    );

    try {
      await createNotification(
        prescription.patient_user_id,
        'payment_required',
        'Paiement Requis',
        `Facture de ${montant} MAD pour l'ordonnance N° ${prescription.numero_ordonnance}. Veuillez effectuer le paiement pour télécharger.`,
        invoiceId,
        req.user.id
      );
    } catch (notifError) {
      console.error('Erreur notification paiement:', notifError);
    }

    res.status(201).json({
      success: true,
      message: 'Facture créée avec succès',
      data: {
        invoice_id: invoiceId,
        numero_facture: numeroFacture,
        montant: montant
      }
    });
  } catch (error) {
    console.error('Erreur createPrescriptionInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le statut après paiement
// @route   PUT /api/prescriptions/:id/payment
// @access  Private (admin/receptionniste)
exports.updatePrescriptionPayment = async (req, res) => {
  try {
    const { id } = req.params;

    const prescriptionResult = await query(
      `SELECT pr.*, inv.id as invoice_id, inv.montant_total, p.user_id as patient_user_id
       FROM prescriptions pr
       LEFT JOIN invoices inv ON pr.invoice_id = inv.id
       INNER JOIN patients p ON pr.patient_id = p.id
       WHERE pr.id = ?`,
      [id]
    );

    if (prescriptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    const prescription = prescriptionResult[0];

    if (!prescription.invoice_id) {
      return res.status(400).json({
        success: false,
        message: 'Aucune facture associée à cette ordonnance'
      });
    }

    await query(
      `UPDATE invoices 
       SET statut = 'payee', montant_paye = montant_total, date_paiement = NOW()
       WHERE id = ?`,
      [prescription.invoice_id]
    );

    await query(
      'UPDATE prescriptions SET statut = \'payee\' WHERE id = ?',
      [id]
    );

    try {
      await createNotification(
        prescription.patient_user_id,
        'payment_received',
        'Paiement Reçu',
        `Votre paiement de ${prescription.montant_total} MAD a été confirmé. Vous pouvez maintenant télécharger votre ordonnance.`,
        id,
        req.user.id
      );
    } catch (notifError) {
      console.error('Erreur notification confirmation:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Paiement enregistré avec succès'
    });
  } catch (error) {
    console.error('Erreur updatePrescriptionPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du paiement',
      error: error.message
    });
  }
};

// @desc    Supprimer une ordonnance
// @route   DELETE /api/prescriptions/:id
// @access  Private (medecin)
exports.deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const medecinId = req.user.id;

    const prescriptionResult = await query(
      'SELECT id, statut FROM prescriptions WHERE id = ? AND medecin_id = ?',
      [id, medecinId]
    );

    if (prescriptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    const prescription = prescriptionResult[0];

    if (prescription.statut === 'payee') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une ordonnance payée'
      });
    }

    await query('DELETE FROM prescriptions WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Ordonnance supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deletePrescription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'ordonnance',
      error: error.message
    });
  }
};