const { query } = require('../config/database');

// @desc    Obtenir toutes les factures
// @route   GET /api/invoices
// @access  Private (admin, receptionniste, patient)
exports.getAllInvoices = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, patient_id, statut_paiement } = req.query;
    const offset = (page - 1) * limit;
    const userRole = req.user.role;
    const userId = req.user.id;

    let sql = `
      SELECT 
        i.*,
        p.numero_dossier,
        u.nom as patient_nom,
        u.prenom as patient_prenom,
        u.email as patient_email,
        uc.nom as created_by_nom,
        uc.prenom as created_by_prenom
      FROM invoices i
      INNER JOIN patients p ON i.patient_id = p.id
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN users uc ON i.created_by = uc.id
      WHERE 1=1
    `;

    const params = [];

    // Filtrer selon le rôle
    if (userRole === 'patient') {
      sql += ` AND p.user_id = ?`;
      params.push(userId);
    }

    // Filtres supplémentaires
    if (patient_id) {
      sql += ` AND i.patient_id = ?`;
      params.push(patient_id);
    }

    if (statut_paiement) {
      sql += ` AND i.statut_paiement = ?`;
      params.push(statut_paiement);
    }

    // Recherche
    if (search) {
      sql += ` AND (
        i.numero_facture LIKE ? OR 
        u.nom LIKE ? OR 
        u.prenom LIKE ? OR
        p.numero_dossier LIKE ?
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
    sql += ` ORDER BY i.date_emission DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const invoices = await query(sql, params);

    res.status(200).json({
      success: true,
      data: invoices || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur getAllInvoices:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des factures',
      error: error.message
    });
  }
};

// @desc    Obtenir une facture par ID
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        i.*,
        p.numero_dossier,
        p.groupe_sanguin,
        p.assurance_nom,
        p.assurance_numero,
        u.nom as patient_nom,
        u.prenom as patient_prenom,
        u.email as patient_email,
        u.telephone as patient_telephone,
        u.adresse as patient_adresse,
        c.date_consultation,
        c.diagnostic,
        um.nom as medecin_nom,
        um.prenom as medecin_prenom
      FROM invoices i
      INNER JOIN patients p ON i.patient_id = p.id
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN consultations c ON i.consultation_id = c.id
      LEFT JOIN users um ON c.medecin_id = um.id
      WHERE i.id = ?
    `;

    const result = await query(sql, [id]);
    const invoice = result && result.length > 0 ? result[0] : null;

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // Récupérer les lignes de facturation
    const itemsSql = 'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id';
    const items = await query(itemsSql, [id]);

    // Récupérer les paiements
    const paymentsSql = `
      SELECT p.*, u.nom, u.prenom
      FROM payments p
      LEFT JOIN users u ON p.recu_par = u.id
      WHERE p.invoice_id = ?
      ORDER BY p.date_paiement DESC
    `;
    const payments = await query(paymentsSql, [id]);

    res.status(200).json({
      success: true,
      data: {
        ...invoice,
        items: items || [],
        payments: payments || []
      }
    });
  } catch (error) {
    console.error('Erreur getInvoiceById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la facture',
      error: error.message
    });
  }
};

// @desc    Créer une nouvelle facture
// @route   POST /api/invoices
// @access  Private (admin, receptionniste)
exports.createInvoice = async (req, res) => {
  try {
    const {
      consultation_id,
      patient_id,
      date_emission,
      date_echeance,
      items, // Array of { description, quantite, prix_unitaire, type_item }
      taux_tva,
      prise_en_charge_assurance,
      numero_prise_en_charge,
      notes
    } = req.body;

    const created_by = req.user.id;

    // Validation
    if (!patient_id || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Patient et articles sont requis'
      });
    }

    // Générer un numéro de facture unique
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const numero_facture = `FACT-${year}${month}-${randomNum}`;

    // Calculer les montants
    let montant_total = 0;
    let montant_consultation = 0;
    let montant_actes = 0;
    let montant_examens = 0;

    items.forEach(item => {
      const montant = item.quantite * item.prix_unitaire;
      montant_total += montant;

      if (item.type_item === 'consultation') montant_consultation += montant;
      else if (item.type_item === 'acte') montant_actes += montant;
      else if (item.type_item === 'examen') montant_examens += montant;
    });

    // Calculs TVA
    const tauxTVA = taux_tva || 0;
    const montant_ht = montant_total / (1 + tauxTVA / 100);
    const montant_tva = montant_total - montant_ht;
    const montant_ttc = montant_total;

    // Prise en charge assurance
    const priseEnCharge = prise_en_charge_assurance || 0;
    const montant_restant = montant_ttc - priseEnCharge;

    // Créer la facture
    const invoiceSql = `
      INSERT INTO invoices (
        numero_facture, consultation_id, patient_id, date_emission, date_echeance,
        montant_consultation, montant_actes, montant_examens, montant_total,
        montant_paye, montant_restant, taux_tva, montant_ht, montant_tva, montant_ttc,
        statut_paiement, prise_en_charge_assurance, numero_prise_en_charge,
        notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 'non_payee', ?, ?, ?, ?)
    `;

    const invoiceResult = await query(invoiceSql, [
      numero_facture,
      consultation_id || null,
      patient_id,
      date_emission || new Date(),
      date_echeance,
      montant_consultation,
      montant_actes,
      montant_examens,
      montant_total,
      montant_restant,
      tauxTVA,
      montant_ht,
      montant_tva,
      montant_ttc,
      priseEnCharge,
      numero_prise_en_charge,
      notes,
      created_by
    ]);

    const invoice_id = invoiceResult.insertId;

    // Créer les lignes de facturation
    for (const item of items) {
      const itemSql = `
        INSERT INTO invoice_items (
          invoice_id, description, quantite, prix_unitaire, montant_total, type_item
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      await query(itemSql, [
        invoice_id,
        item.description,
        item.quantite,
        item.prix_unitaire,
        item.quantite * item.prix_unitaire,
        item.type_item || 'consultation'
      ]);
    }

    res.status(201).json({
      success: true,
      message: 'Facture créée avec succès',
      data: {
        id: invoice_id,
        numero_facture
      }
    });
  } catch (error) {
    console.error('Erreur createInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la facture',
      error: error.message
    });
  }
};

// @desc    Mettre à jour une facture
// @route   PUT /api/invoices/:id
// @access  Private (admin, receptionniste)
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date_echeance,
      notes,
      statut_paiement
    } = req.body;

    // Vérifier si la facture existe
    const result = await query('SELECT id FROM invoices WHERE id = ?', [id]);
    const invoice = result && result.length > 0 ? result[0] : null;
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    const sql = `
      UPDATE invoices 
      SET date_echeance = ?, notes = ?, statut_paiement = ?
      WHERE id = ?
    `;

    await query(sql, [date_echeance, notes, statut_paiement, id]);

    res.status(200).json({
      success: true,
      message: 'Facture mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur updateInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la facture',
      error: error.message
    });
  }
};

// @desc    Enregistrer un paiement
// @route   POST /api/invoices/:id/payment
// @access  Private (admin, receptionniste)
exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      montant,
      methode_paiement,
      reference_transaction,
      date_paiement,
      notes
    } = req.body;

    const recu_par = req.user.id;

    // Validation
    if (!montant || !methode_paiement) {
      return res.status(400).json({
        success: false,
        message: 'Montant et méthode de paiement sont requis'
      });
    }

    // Récupérer la facture
    const result = await query(
      'SELECT montant_ttc, montant_paye, montant_restant FROM invoices WHERE id = ?',
      [id]
    );
    const invoice = result && result.length > 0 ? result[0] : null;

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // Vérifier que le montant ne dépasse pas le restant dû
    if (parseFloat(montant) > parseFloat(invoice.montant_restant)) {
      return res.status(400).json({
        success: false,
        message: 'Le montant dépasse le restant dû'
      });
    }

    // Enregistrer le paiement
    const paymentSql = `
      INSERT INTO payments (
        invoice_id, montant, methode_paiement, reference_transaction,
        date_paiement, notes, recu_par
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await query(paymentSql, [
      id,
      montant,
      methode_paiement,
      reference_transaction,
      date_paiement || new Date(),
      notes,
      recu_par
    ]);

    // Mettre à jour la facture
    const nouveauMontantPaye = parseFloat(invoice.montant_paye) + parseFloat(montant);
    const nouveauMontantRestant = parseFloat(invoice.montant_ttc) - nouveauMontantPaye;

    let nouveauStatut = 'partiellement_payee';
    if (nouveauMontantRestant <= 0) {
      nouveauStatut = 'payee';
    } else if (nouveauMontantPaye === 0) {
      nouveauStatut = 'non_payee';
    }

    const updateSql = `
      UPDATE invoices 
      SET montant_paye = ?,
          montant_restant = ?,
          statut_paiement = ?,
          date_paiement = ?
      WHERE id = ?
    `;

    await query(updateSql, [
      nouveauMontantPaye,
      nouveauMontantRestant,
      nouveauStatut,
      nouveauStatut === 'payee' ? new Date() : null,
      id
    ]);

    res.status(200).json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: {
        montant_paye: nouveauMontantPaye,
        montant_restant: nouveauMontantRestant,
        statut: nouveauStatut
      }
    });
  } catch (error) {
    console.error('Erreur addPayment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement du paiement',
      error: error.message
    });
  }
};

// @desc    Supprimer une facture
// @route   DELETE /api/invoices/:id
// @access  Private (admin uniquement)
exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la facture existe
    const result = await query('SELECT id, statut_paiement FROM invoices WHERE id = ?', [id]);
    const invoice = result && result.length > 0 ? result[0] : null;
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // Empêcher la suppression si la facture est payée
    if (invoice.statut_paiement === 'payee') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer une facture payée'
      });
    }

    // Supprimer la facture (cascade supprimera les items et paiements)
    await query('DELETE FROM invoices WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Facture supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la facture',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques de facturation
// @route   GET /api/invoices/stats
// @access  Private (admin, receptionniste)
exports.getInvoiceStats = async (req, res) => {
  try {
    // Total factures
    const totalResult = await query('SELECT COUNT(*) as total FROM invoices');
    const total = (totalResult && totalResult.length > 0) ? totalResult[0].total : 0;

    // Montant total facturé
    const amountResult = await query('SELECT SUM(montant_ttc) as total FROM invoices');
    const totalAmount = (amountResult && amountResult.length > 0) ? (amountResult[0].total || 0) : 0;

    // Montant payé
    const paidResult = await query('SELECT SUM(montant_paye) as total FROM invoices');
    const totalPaid = (paidResult && paidResult.length > 0) ? (paidResult[0].total || 0) : 0;

    // Montant impayé
    const unpaidResult = await query('SELECT SUM(montant_restant) as total FROM invoices WHERE statut_paiement != "payee"');
    const totalUnpaid = (unpaidResult && unpaidResult.length > 0) ? (unpaidResult[0].total || 0) : 0;

    // Par statut
    const statusSql = `
      SELECT statut_paiement, COUNT(*) as count, SUM(montant_ttc) as montant
      FROM invoices
      GROUP BY statut_paiement
    `;
    const byStatus = await query(statusSql);

    // Ce mois
    const thisMonthSql = `
      SELECT COUNT(*) as count, SUM(montant_ttc) as montant
      FROM invoices
      WHERE MONTH(date_emission) = MONTH(CURRENT_DATE())
      AND YEAR(date_emission) = YEAR(CURRENT_DATE())
    `;
    const thisMonthResult = await query(thisMonthSql);
    const thisMonth = thisMonthResult && thisMonthResult.length > 0 ? thisMonthResult[0] : { count: 0, montant: 0 };

    // Aujourd'hui
    const todaySql = `
      SELECT COUNT(*) as count, SUM(montant_ttc) as montant
      FROM invoices
      WHERE DATE(date_emission) = CURRENT_DATE()
    `;
    const todayResult = await query(todaySql);
    const today = todayResult && todayResult.length > 0 ? todayResult[0] : { count: 0, montant: 0 };

    res.status(200).json({
      success: true,
      data: {
        total,
        totalAmount,
        totalPaid,
        totalUnpaid,
        byStatus: byStatus || [],
        thisMonth: {
          count: thisMonth.count || 0,
          amount: thisMonth.montant || 0
        },
        today: {
          count: today.count || 0,
          amount: today.montant || 0
        }
      }
    });
  } catch (error) {
    console.error('Erreur getInvoiceStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

// @desc    Annuler une facture
// @route   PUT /api/invoices/:id/cancel
// @access  Private (admin)
exports.cancelInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si la facture existe
    const result = await query('SELECT id, statut_paiement FROM invoices WHERE id = ?', [id]);
    const invoice = result && result.length > 0 ? result[0] : null;
    
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée'
      });
    }

    // Empêcher l'annulation si la facture est payée
    if (invoice.statut_paiement === 'payee') {
      return res.status(400).json({
        success: false,
        message: 'Impossible d\'annuler une facture payée'
      });
    }

    await query('UPDATE invoices SET statut_paiement = "annulee" WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Facture annulée avec succès'
    });
  } catch (error) {
    console.error('Erreur cancelInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la facture',
      error: error.message
    });
  }
};