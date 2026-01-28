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
  MdRefresh
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
      planifie: { label: 'Planifié', class: 'appointments-status-planned', icon: <MdSchedule /> },
      confirme: { label: 'Confirmé', class: 'appointments-status-confirmed', icon: <MdCheckCircle /> },
      en_cours: { label: 'En cours', class: 'appointments-status-ongoing', icon: <MdAccessTime /> },
      termine: { label: 'Terminé', class: 'appointments-status-completed', icon: <MdCheckCircle /> },
      annule: { label: 'Annulé', class: 'appointments-status-cancelled', icon: <MdCancel /> },
      non_presente: { label: 'Non présenté', class: 'appointments-status-absent', icon: <MdCancel /> }
    };
    
    const { label, class: className, icon } = config[statut] || config.planifie;
    
    return (
      <span className={`appointments-status-badge ${className}`}>
        {icon}
        {label}
      </span>
    );
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
              <button 
                className="appointments-modal-close" 
                onClick={() => setShowModal(false)}
              >
                <MdCancel />
              </button>
            </div>
            <div className="appointments-modal-body">
              {/* Contenu du modal */}
              <div className="appointments-appointment-time">
                <MdAccessTime />
                <strong>{formatTime(selectedAppointment.date_heure)}</strong>
              </div>
              <div className="appointments-patient-info">
                <div className="appointments-info-row">
                  <MdPerson />
                  <span>{selectedAppointment.patient_prenom} {selectedAppointment.patient_nom}</span>
                </div>
                <div className="appointments-info-row">
                  <MdPhone />
                  <span>{selectedAppointment.patient_telephone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;