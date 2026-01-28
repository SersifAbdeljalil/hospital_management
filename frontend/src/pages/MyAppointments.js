import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import myAppointmentService from '../services/myAppointmentService';
import useAuth from '../hooks/useAuth';
import {
  MdCalendarToday,
  MdAccessTime,
  MdPerson,
  MdPhone,
  MdLocationOn,
  MdNotes,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdFilterList,
  MdSearch,
  MdRefresh,
  MdDownload,
  MdEdit,
  MdClose,
  MdWarning
} from 'react-icons/md';
import './MyAppointments.css';

const MyAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: '',
    statut: '',
    search: ''
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await myAppointmentService.getMyAppointments(filters);
      if (response.success) {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await myAppointmentService.updateAppointmentStatus(id, newStatus);
      if (response.success) {
        toast.success('Statut mis à jour');
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const response = await myAppointmentService.getMyAppointmentById(id);
      if (response.success) {
        setSelectedAppointment(response.data);
        setShowModal(true);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      await myAppointmentService.downloadAppointmentPDF(id);
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      toast.error('Erreur lors du téléchargement du PDF');
    }
  };

  const handleAddNotes = (appointment) => {
    setSelectedAppointment(appointment);
    setNotes(appointment.notes || '');
    setShowNotesModal(true);
  };

  const handleSaveNotes = async () => {
    try {
      const response = await myAppointmentService.addAppointmentNotes(
        selectedAppointment.id,
        notes
      );
      if (response.success) {
        toast.success('Notes enregistrées');
        setShowNotesModal(false);
        fetchAppointments();
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (statut) => {
    const config = {
      planifie: { label: 'Planifié', class: 'appointments-status-planifie', icon: <MdSchedule /> },
      confirme: { label: 'Confirmé', class: 'appointments-status-confirme', icon: <MdCheckCircle /> },
      en_cours: { label: 'En cours', class: 'appointments-status-en_cours', icon: <MdAccessTime /> },
      termine: { label: 'Terminé', class: 'appointments-status-termine', icon: <MdCheckCircle /> },
      annule: { label: 'Annulé', class: 'appointments-status-annule', icon: <MdCancel /> },
      non_presente: { label: 'Non présenté', class: 'appointments-status-non_presente', icon: <MdWarning /> }
    };
    
    const { label, class: className, icon } = config[statut] || config.planifie;
    
    return (
      <span className={`appointments-status-badge ${className}`}>
        {icon}
        {label}
      </span>
    );
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

  if (loading) {
    return (
      <div className="my-appointments-page">
        <div className="appointments-loading-container">
          <div className="appointments-spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-appointments-page">
      {/* Header */}
      <div className="appointments-page-header">
        <div>
          <h1>Mes Rendez-vous</h1>
          <p>Gérez vos consultations et rendez-vous</p>
        </div>
        <button className="appointments-btn-refresh" onClick={fetchAppointments}>
          <MdRefresh />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="appointments-filters-section">
        <div className="appointments-filter-item">
          <MdCalendarToday />
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="appointments-filter-input"
          />
        </div>

        <div className="appointments-filter-item">
          <MdFilterList />
          <select
            value={filters.statut}
            onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
            className="appointments-filter-select"
          >
            <option value="">Tous les statuts</option>
            <option value="planifie">Planifié</option>
            <option value="confirme">Confirmé</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        </div>

        <div className="appointments-filter-item appointments-search-item">
          <MdSearch />
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="appointments-filter-input"
          />
        </div>
      </div>

      {/* Liste des rendez-vous */}
      <div className="appointments-grid">
        {appointments.length > 0 ? (
          appointments.map((apt) => (
            <div key={apt.id} className="appointments-appointment-card">
              <div className="appointments-card-header">
                <div className="appointments-appointment-date">
                  <MdCalendarToday />
                  <span>{formatDate(apt.date_heure)}</span>
                </div>
                {getStatusBadge(apt.statut)}
              </div>

              <div className="appointments-card-body">
                <div className="appointments-appointment-time">
                  <MdAccessTime />
                  <strong>{formatTime(apt.date_heure)}</strong>
                  <span>({apt.duree_minutes} min)</span>
                </div>

                <div className="appointments-patient-info">
                  <div className="appointments-info-row">
                    <MdPerson />
                    <span>{apt.patient_prenom} {apt.patient_nom}</span>
                  </div>
                  <div className="appointments-info-row">
                    <MdPhone />
                    <span>{apt.patient_telephone || 'N/A'}</span>
                  </div>
                  {apt.salle && (
                    <div className="appointments-info-row">
                      <MdLocationOn />
                      <span>Salle {apt.salle}</span>
                    </div>
                  )}
                </div>

                {apt.motif && (
                  <div className="appointments-appointment-motif">
                    <MdNotes />
                    <p>{apt.motif}</p>
                  </div>
                )}
              </div>

              <div className="appointments-card-footer">
                <button
                  className="appointments-btn-details"
                  onClick={() => handleViewDetails(apt.id)}
                >
                  Voir détails
                </button>

                <button
                  className="appointments-btn-pdf"
                  onClick={() => handleDownloadPDF(apt.id)}
                  title="Télécharger en PDF"
                >
                  <MdDownload />
                  PDF
                </button>

                <button
                  className="appointments-btn-notes"
                  onClick={() => handleAddNotes(apt)}
                  title="Ajouter des notes"
                >
                  <MdEdit />
                  Notes
                </button>
                
                {apt.statut === 'confirme' && (
                  <button
                    className="appointments-btn-start"
                    onClick={() => handleStatusChange(apt.id, 'en_cours')}
                  >
                    Commencer
                  </button>
                )}
                
                {apt.statut === 'en_cours' && (
                  <button
                    className="appointments-btn-complete"
                    onClick={() => navigate(`/consultations/new?appointment=${apt.id}`)}
                  >
                    Créer consultation
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="appointments-empty-state">
            <MdCalendarToday />
            <p>Aucun rendez-vous trouvé</p>
          </div>
        )}
      </div>

      {/* Modal détails */}
      {showModal && selectedAppointment && (
        <div className="appointments-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="appointments-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="appointments-modal-header">
              <h2>Détails du Rendez-vous</h2>
              <button className="appointments-modal-close" onClick={() => setShowModal(false)}>
                <MdClose />
              </button>
            </div>
            <div className="appointments-modal-body">
              <div className="detail-section">
                <h3>Informations du Rendez-vous</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Date:</span>
                    <span className="value">{formatDate(selectedAppointment.date_heure)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Heure:</span>
                    <span className="value">{formatTime(selectedAppointment.date_heure)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Durée:</span>
                    <span className="value">{selectedAppointment.duree_minutes} minutes</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Statut:</span>
                    <span className="value">{getStatusBadge(selectedAppointment.statut)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Informations Patient</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Nom:</span>
                    <span className="value">
                      {selectedAppointment.patient_prenom} {selectedAppointment.patient_nom}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">N° Dossier:</span>
                    <span className="value">{selectedAppointment.numero_dossier}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Téléphone:</span>
                    <span className="value">{selectedAppointment.patient_telephone || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Âge:</span>
                    <span className="value">
                      {calculateAge(selectedAppointment.patient_date_naissance)} ans
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Sexe:</span>
                    <span className="value">{selectedAppointment.patient_sexe || 'N/A'}</span>
                  </div>
                  {selectedAppointment.groupe_sanguin && (
                    <div className="detail-item">
                      <span className="label">Groupe sanguin:</span>
                      <span className="value">{selectedAppointment.groupe_sanguin}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedAppointment.motif && (
                <div className="detail-section">
                  <h3>Motif de consultation</h3>
                  <p className="detail-text">{selectedAppointment.motif}</p>
                </div>
              )}

              {selectedAppointment.antecedents_medicaux && (
                <div className="detail-section">
                  <h3>Antécédents médicaux</h3>
                  <p className="detail-text">{selectedAppointment.antecedents_medicaux}</p>
                </div>
              )}

              {selectedAppointment.allergies && (
                <div className="allergies-section">
                  <h3><MdWarning /> Allergies</h3>
                  <p className="detail-text alert">{selectedAppointment.allergies}</p>
                </div>
              )}

              {selectedAppointment.notes && (
                <div className="detail-section">
                  <h3>Notes</h3>
                  <p className="detail-text">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Notes */}
      {showNotesModal && (
        <div className="appointments-modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="appointments-modal-content appointments-modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="appointments-modal-header">
              <h2>Ajouter des notes</h2>
              <button className="appointments-modal-close" onClick={() => setShowNotesModal(false)}>
                <MdClose />
              </button>
            </div>
            <div className="appointments-modal-body">
              <textarea
                className="notes-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Saisissez vos notes ici..."
                rows="6"
              />
            </div>
            <div className="appointments-modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowNotesModal(false)}
              >
                Annuler
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveNotes}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;