import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import myPatientService from '../services/myPatientService';
import {
  MdPerson,
  MdPhone,
  MdEmail,
  MdLocalHospital,
  MdCalendarToday,
  MdSearch,
  MdRefresh,
  MdVisibility,
  MdClose,
  MdWarning
} from 'react-icons/md';
import { FaUserInjured } from 'react-icons/fa';
import './MyPatients.css';

const MyPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await myPatientService.getMyPatients({ search });
      if (response.success) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const response = await myPatientService.getMyPatientById(id);
      if (response.success) {
        setSelectedPatient(response.data);
        setShowModal(true);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="my-patients-page">
        <div className="patients-loading-container">
          <div className="patients-spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-patients-page">
      {/* Header */}
      <div className="patients-page-header">
        <div>
          <h1>Mes Patients</h1>
          <p>{patients.length} patient(s) suivi(s)</p>
        </div>
        <button className="patients-btn-refresh" onClick={fetchPatients}>
          <MdRefresh />
          Actualiser
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="patients-search-section">
        <div className="patients-search-bar">
          <MdSearch />
          <input
            type="text"
            placeholder="Rechercher un patient (nom, prénom, n° dossier)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="patients-search-input"
          />
        </div>
      </div>

      {/* Liste des patients */}
      <div className="patients-grid">
        {patients.length > 0 ? (
          patients.map((patient) => (
            <div key={patient.id} className="patient-card">
              <div className="card-header">
                <div className="patient-avatar">
                  <FaUserInjured />
                </div>
                <div className="patient-main-info">
                  <h3>{patient.prenom} {patient.nom}</h3>
                  <span className="patient-number">N° {patient.numero_dossier}</span>
                </div>
              </div>

              <div className="card-body">
                <div className="patient-details">
                  <div className="detail-row">
                    <MdCalendarToday />
                    <span>{calculateAge(patient.date_naissance)} ans</span>
                  </div>
                  <div className="detail-row">
                    <MdPhone />
                    <span>{patient.telephone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <MdEmail />
                    <span>{patient.email || 'N/A'}</span>
                  </div>
                  {patient.groupe_sanguin && (
                    <div className="detail-row">
                      <MdLocalHospital />
                      <span>Groupe {patient.groupe_sanguin}</span>
                    </div>
                  )}
                </div>

                <div className="patient-stats">
                  <div className="stat-item">
                    <span className="stat-value">{patient.total_rdv || 0}</span>
                    <span className="stat-label">RDV</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{patient.total_consultations || 0}</span>
                    <span className="stat-label">Consultations</span>
                  </div>
                </div>

                {patient.dernier_rdv && (
                  <div className="last-visit">
                    <small>Dernier RDV: {formatDate(patient.dernier_rdv)}</small>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button
                  className="patients-btn-view"
                  onClick={() => handleViewDetails(patient.id)}
                >
                  <MdVisibility />
                  Voir le dossier
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="patients-empty-state">
            <FaUserInjured />
            <p>Aucun patient trouvé</p>
          </div>
        )}
      </div>

      {/* Modal Détails Patient */}
      {showModal && selectedPatient && (
        <div className="patients-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="patients-modal-content patients-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="patients-modal-header">
              <h2>Dossier Patient</h2>
              <button className="patients-modal-close" onClick={() => setShowModal(false)}>
                <MdClose />
              </button>
            </div>
            <div className="patients-modal-body">
              {/* Informations générales */}
              <div className="detail-section">
                <h3>Informations Générales</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Nom complet:</span>
                    <span className="value">
                      {selectedPatient.prenom} {selectedPatient.nom}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">N° Dossier:</span>
                    <span className="value">{selectedPatient.numero_dossier}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Date de naissance:</span>
                    <span className="value">
                      {new Date(selectedPatient.date_naissance).toLocaleDateString('fr-FR')}
                      {' '}({calculateAge(selectedPatient.date_naissance)} ans)
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Sexe:</span>
                    <span className="value">{selectedPatient.sexe === 'M' ? 'Masculin' : 'Féminin'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Groupe sanguin:</span>
                    <span className="value">{selectedPatient.groupe_sanguin || 'Non renseigné'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Téléphone:</span>
                    <span className="value">{selectedPatient.telephone || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{selectedPatient.email || 'N/A'}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="label">Adresse:</span>
                    <span className="value">{selectedPatient.adresse || 'Non renseignée'}</span>
                  </div>
                </div>
              </div>

              {/* Contact d'urgence */}
              {selectedPatient.contact_urgence_nom && (
                <div className="detail-section">
                  <h3>Contact d'Urgence</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Nom:</span>
                      <span className="value">{selectedPatient.contact_urgence_nom}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Téléphone:</span>
                      <span className="value">{selectedPatient.contact_urgence_telephone}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Antécédents médicaux */}
              {selectedPatient.antecedents_medicaux && (
                <div className="detail-section">
                  <h3>Antécédents Médicaux</h3>
                  <p className="detail-text">{selectedPatient.antecedents_medicaux}</p>
                </div>
              )}

              {/* Allergies */}
              {selectedPatient.allergies && (
                <div className="allergies-section">
                  <h3><MdWarning /> Allergies</h3>
                  <p className="detail-text alert">{selectedPatient.allergies}</p>
                </div>
              )}

              {/* Médicaments actuels */}
              {selectedPatient.medicaments_actuels && (
                <div className="detail-section">
                  <h3>Médicaments Actuels</h3>
                  <p className="detail-text">{selectedPatient.medicaments_actuels}</p>
                </div>
              )}

              {/* Historique des rendez-vous */}
              {selectedPatient.appointments && selectedPatient.appointments.length > 0 && (
                <div className="detail-section">
                  <h3>Derniers Rendez-vous</h3>
                  <div className="appointments-list">
                    {selectedPatient.appointments.slice(0, 5).map((apt) => (
                      <div key={apt.id} className="appointment-item">
                        <div className="apt-date">
                          <MdCalendarToday />
                          {formatDate(apt.date_heure)}
                        </div>
                        <div className="apt-motif">{apt.motif || 'Consultation générale'}</div>
                        <div className={`apt-status status-${apt.statut}`}>
                          {apt.statut}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dernières consultations */}
              {selectedPatient.consultations && selectedPatient.consultations.length > 0 && (
                <div className="detail-section">
                  <h3>Dernières Consultations</h3>
                  <div className="consultations-list">
                    {selectedPatient.consultations.map((consult) => (
                      <div key={consult.id} className="consultation-item">
                        <div className="consult-date">
                          {formatDate(consult.date_consultation)}
                        </div>
                        <div className="consult-diagnostic">
                          {consult.diagnostic || 'Diagnostic non renseigné'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPatients;