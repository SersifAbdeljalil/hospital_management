import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import settingsService from '../services/settingsService';
import {
  MdSettings,
  MdSave,
  MdRefresh
} from 'react-icons/md';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsService.getAllSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (groupe, cle, value) => {
    setSettings(prev => ({
      ...prev,
      [groupe]: prev[groupe].map(setting =>
        setting.cle === cle ? { ...setting, valeur: value } : setting
      )
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convertir en tableau pour l'API
      const allSettings = [];
      Object.values(settings).forEach(groupe => {
        allSettings.push(...groupe);
      });

      const response = await settingsService.bulkUpdate(allSettings);
      if (response.success) {
        toast.success('Paramètres sauvegardés avec succès');
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleInitialize = async () => {
    if (!window.confirm('Voulez-vous initialiser les paramètres par défaut ?')) {
      return;
    }

    try {
      const response = await settingsService.initializeDefaults();
      if (response.success) {
        toast.success('Paramètres initialisés avec succès');
        fetchSettings();
      }
    } catch (error) {
      toast.error(error.message || 'Erreur');
    }
  };

  const renderInput = (setting) => {
    switch (setting.type) {
      case 'boolean':
        return (
          <select
            value={setting.valeur}
            onChange={(e) => handleInputChange(setting.groupe || 'general', setting.cle, e.target.value)}
            className="form-input"
          >
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={setting.valeur}
            onChange={(e) => handleInputChange(setting.groupe || 'general', setting.cle, e.target.value)}
            className="form-input"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={setting.valeur}
            onChange={(e) => handleInputChange(setting.groupe || 'general', setting.cle, e.target.value)}
            className="form-input"
          />
        );
    }
  };

  const groupTitles = {
    general: 'Général',
    appointments: 'Rendez-vous',
    billing: 'Facturation',
    notifications: 'Notifications',
    security: 'Sécurité'
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="header-left">
          <h1><MdSettings /> Paramètres Système</h1>
          <p>Configuration de l'application</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={handleInitialize}
          >
            <MdRefresh />
            Initialiser
          </button>
          
          <button 
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <MdSave />
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : (
        <div className="settings-container">
          {Object.keys(settings).map((groupe) => (
            <div key={groupe} className="settings-group">
              <h2>{groupTitles[groupe] || groupe}</h2>
              
              <div className="settings-grid">
                {settings[groupe].map((setting) => (
                  <div key={setting.cle} className="setting-item">
                    <label className="setting-label">
                      {setting.description || setting.cle}
                    </label>
                    {renderInput(setting)}
                    <span className="setting-key">{setting.cle}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Settings;