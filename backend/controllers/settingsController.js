const { query } = require('../config/database');

// @desc    Obtenir tous les paramètres
// @route   GET /api/settings
// @access  Private (admin)
exports.getAllSettings = async (req, res) => {
  try {
    const { groupe } = req.query;

    let sql = 'SELECT * FROM settings';
    const params = [];

    if (groupe) {
      sql += ' WHERE groupe = ?';
      params.push(groupe);
    }

    sql += ' ORDER BY groupe, cle';

    const settings = await query(sql, params);

    // Organiser par groupe
    const organized = {};
    settings.forEach(setting => {
      const group = setting.groupe || 'general';
      if (!organized[group]) {
        organized[group] = [];
      }
      organized[group].push({
        id: setting.id,
        cle: setting.cle,
        valeur: setting.valeur,
        type: setting.type,
        description: setting.description
      });
    });

    res.status(200).json({
      success: true,
      data: organized
    });
  } catch (error) {
    console.error('Erreur getAllSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des paramètres',
      error: error.message
    });
  }
};

// @desc    Obtenir un paramètre par clé
// @route   GET /api/settings/:cle
// @access  Private
exports.getSettingByKey = async (req, res) => {
  try {
    const { cle } = req.params;

    const [setting] = await query('SELECT * FROM settings WHERE cle = ?', [cle]);

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Paramètre non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Erreur getSettingByKey:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du paramètre',
      error: error.message
    });
  }
};

// @desc    Créer ou mettre à jour un paramètre
// @route   POST /api/settings
// @access  Private (admin)
exports.upsertSetting = async (req, res) => {
  try {
    const { cle, valeur, type, description, groupe } = req.body;

    // Validation
    if (!cle) {
      return res.status(400).json({
        success: false,
        message: 'La clé est requise'
      });
    }

    // Vérifier si le paramètre existe
    const [existing] = await query('SELECT id FROM settings WHERE cle = ?', [cle]);

    if (existing) {
      // Mettre à jour
      const sql = `
        UPDATE settings 
        SET valeur = ?, type = ?, description = ?, groupe = ?
        WHERE cle = ?
      `;

      await query(sql, [valeur, type || 'string', description, groupe, cle]);

      res.status(200).json({
        success: true,
        message: 'Paramètre mis à jour avec succès'
      });
    } else {
      // Créer
      const sql = `
        INSERT INTO settings (cle, valeur, type, description, groupe)
        VALUES (?, ?, ?, ?, ?)
      `;

      const result = await query(sql, [cle, valeur, type || 'string', description, groupe || 'general']);

      res.status(201).json({
        success: true,
        message: 'Paramètre créé avec succès',
        data: {
          id: result.insertId
        }
      });
    }
  } catch (error) {
    console.error('Erreur upsertSetting:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la sauvegarde du paramètre',
      error: error.message
    });
  }
};

// @desc    Mettre à jour plusieurs paramètres
// @route   PUT /api/settings/bulk
// @access  Private (admin)
exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Format invalide'
      });
    }

    // Mettre à jour chaque paramètre
    for (const setting of settings) {
      if (setting.cle) {
        await query(
          'UPDATE settings SET valeur = ? WHERE cle = ?',
          [setting.valeur, setting.cle]
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Paramètres mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur bulkUpdateSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des paramètres',
      error: error.message
    });
  }
};

// @desc    Supprimer un paramètre
// @route   DELETE /api/settings/:cle
// @access  Private (admin)
exports.deleteSetting = async (req, res) => {
  try {
    const { cle } = req.params;

    const [setting] = await query('SELECT id FROM settings WHERE cle = ?', [cle]);

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Paramètre non trouvé'
      });
    }

    await query('DELETE FROM settings WHERE cle = ?', [cle]);

    res.status(200).json({
      success: true,
      message: 'Paramètre supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteSetting:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du paramètre',
      error: error.message
    });
  }
};

// @desc    Initialiser les paramètres par défaut
// @route   POST /api/settings/initialize
// @access  Private (admin)
exports.initializeDefaultSettings = async (req, res) => {
  try {
    const defaultSettings = [
      // Général
      { cle: 'nom_hopital', valeur: 'Hôpital Central', type: 'string', groupe: 'general', description: 'Nom de l\'établissement' },
      { cle: 'adresse_hopital', valeur: '', type: 'string', groupe: 'general', description: 'Adresse de l\'établissement' },
      { cle: 'telephone_hopital', valeur: '', type: 'string', groupe: 'general', description: 'Téléphone principal' },
      { cle: 'email_hopital', valeur: '', type: 'string', groupe: 'general', description: 'Email de contact' },
      
      // Rendez-vous
      { cle: 'duree_rdv_defaut', valeur: '30', type: 'number', groupe: 'appointments', description: 'Durée par défaut d\'un RDV (minutes)' },
      { cle: 'heure_debut', valeur: '08:00', type: 'string', groupe: 'appointments', description: 'Heure d\'ouverture' },
      { cle: 'heure_fin', valeur: '18:00', type: 'string', groupe: 'appointments', description: 'Heure de fermeture' },
      { cle: 'jours_ouvres', valeur: '1,2,3,4,5', type: 'string', groupe: 'appointments', description: 'Jours ouvrés (1=Lundi, 7=Dimanche)' },
      
      // Facturation
      { cle: 'taux_tva', valeur: '0', type: 'number', groupe: 'billing', description: 'Taux de TVA (%)' },
      { cle: 'delai_paiement', valeur: '30', type: 'number', groupe: 'billing', description: 'Délai de paiement (jours)' },
      { cle: 'prix_consultation_defaut', valeur: '50', type: 'number', groupe: 'billing', description: 'Prix consultation par défaut' },
      
      // Notifications
      { cle: 'rappel_rdv_actif', valeur: 'true', type: 'boolean', groupe: 'notifications', description: 'Activer rappels RDV' },
      { cle: 'rappel_rdv_delai', valeur: '24', type: 'number', groupe: 'notifications', description: 'Délai rappel RDV (heures)' },
      
      // Sécurité
      { cle: 'session_timeout', valeur: '30', type: 'number', groupe: 'security', description: 'Durée session (minutes)' },
      { cle: 'password_min_length', valeur: '8', type: 'number', groupe: 'security', description: 'Longueur minimale mot de passe' }
    ];

    for (const setting of defaultSettings) {
      // Vérifier si existe déjà
      const [existing] = await query('SELECT id FROM settings WHERE cle = ?', [setting.cle]);
      
      if (!existing) {
        await query(
          'INSERT INTO settings (cle, valeur, type, groupe, description) VALUES (?, ?, ?, ?, ?)',
          [setting.cle, setting.valeur, setting.type, setting.groupe, setting.description]
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Paramètres par défaut initialisés avec succès'
    });
  } catch (error) {
    console.error('Erreur initializeDefaultSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'initialisation des paramètres',
      error: error.message
    });
  }
};