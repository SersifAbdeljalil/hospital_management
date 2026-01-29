// Ajouter cette route dans votre prescriptionController.js

// @desc    Payer une ordonnance
// @route   POST /api/prescriptions/:id/pay
// @access  Private (patient)
exports.payPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { montant, methode_paiement } = req.body;
    const userId = req.user.id;

    // Vérifier que l'ordonnance existe
    const prescriptionResult = await query(
      `SELECT pr.*, p.user_id as patient_user_id
       FROM prescriptions pr
       INNER JOIN patients p ON pr.patient_id = p.id
       WHERE pr.id = ?`,
      [id]
    );

    if (!prescriptionResult || prescriptionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ordonnance non trouvée'
      });
    }

    const prescription = prescriptionResult[0];

    // Vérifier que c'est bien le patient
    if (prescription.patient_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Vérifier que l'ordonnance n'est pas déjà payée
    if (prescription.statut === 'payee') {
      return res.status(400).json({
        success: false,
        message: 'Cette ordonnance a déjà été payée'
      });
    }

    // Créer la facture si elle n'existe pas
    let invoiceId = prescription.invoice_id;

    if (!invoiceId) {
      const numeroFacture = `FACT-ORD-${Date.now()}`;
      
      const invoiceResult = await query(
        `INSERT INTO invoices 
         (numero_facture, patient_id, montant_total, montant_paye, montant_restant, 
          statut_paiement, description, type, date_emission, date_paiement, created_by)
         VALUES (?, ?, ?, ?, 0, 'payee', ?, 'ordonnance', NOW(), NOW(), ?)`,
        [
          numeroFacture,
          prescription.patient_id,
          montant,
          montant,
          `Paiement ordonnance N° ${prescription.numero_ordonnance}`,
          userId
        ]
      );

      invoiceId = invoiceResult.insertId;

      // Lier la facture à l'ordonnance
      await query(
        'UPDATE prescriptions SET invoice_id = ? WHERE id = ?',
        [invoiceId, id]
      );
    } else {
      // Mettre à jour la facture existante
      await query(
        `UPDATE invoices 
         SET statut_paiement = 'payee', 
             montant_paye = montant_total,
             montant_restant = 0,
             date_paiement = NOW()
         WHERE id = ?`,
        [invoiceId]
      );
    }

    // Mettre à jour le statut de l'ordonnance
    await query(
      'UPDATE prescriptions SET statut = \'payee\' WHERE id = ?',
      [id]
    );

    // Enregistrer le paiement dans la table payments
    await query(
      `INSERT INTO payments 
       (invoice_id, montant, methode_paiement, date_paiement, recu_par)
       VALUES (?, ?, ?, NOW(), ?)`,
      [invoiceId, montant, methode_paiement, userId]
    );

    // Créer une notification pour le patient
    try {
      await createNotification(
        userId,
        'payment_received',
        'Paiement Confirmé',
        `Votre paiement de ${montant} MAD pour l'ordonnance N° ${prescription.numero_ordonnance} a été confirmé. Vous pouvez maintenant télécharger votre ordonnance signée.`,
        id,
        userId
      );
    } catch (notifError) {
      console.error('Erreur notification:', notifError);
    }

    res.status(200).json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: {
        prescription_id: id,
        invoice_id: invoiceId,
        montant_paye: montant,
        statut: 'payee'
      }
    });
  } catch (error) {
    console.error('Erreur payPrescription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du paiement',
      error: error.message
    });
  }
};