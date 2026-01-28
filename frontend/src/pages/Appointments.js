import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import appointmentService from '../services/appointmentService';
import patientService from '../services/patientService';
import useAuth from '../hooks/useAuth';
import {
  MdAdd,
  MdClose,
  MdEdit,
  MdDelete,
  MdVisibility,
  MdCalendarToday,
  MdAccessTime,
  MdPerson,
  MdLocalHospital,
  MdDescription,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdWarning
} from 'react-icons/md';
import './Appointments.css';

const Appointments = () => {
  const { user } = useAuth();
  
  // États
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // list ou calendar
  
  const [formData, setFormData] = useState({
    patient_id: '',
    medecin_id: '',
    date: '',
    time: '',
    duree: 30,
    motif: '',
    notes: ''
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    fetchAppointments();
    if (user?.role !== 'patient') {
      fetchPatients();
    }
    if (user?.role === 'admin' || user?.role === 'receptionniste') {
      fetchDoctors();
    }
  }, [filterStatus]);

  // Récupérer les rendez-vous
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus !== 'all') {
        params.statut = filterStatus;
      }

      const response = await appointmentService.getAllAppointments(params);
      if (response.success) {
        setAppointments(response.data);
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les patients
  const fetchPatients = async () => {
    try {
      const response = await patientService.getAllPatients({ limit: 1000 });
      if (response.success) {
        setPatients(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement patients:', error);
    }
  };

  // Récupérer les médecins
  const fetchDoctors = async () => {
    try {
      // Appel API pour obtenir les médecins
      // Pour l'instant, on peut créer un endpoint ou utiliser une requête directe
      setDoctors([
        { id: 2, nom: 'Bennani', prenom: 'Ahmed', specialite: 'Cardiologie' }
        // Ajouter d'autres médecins de test
      ]);
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
    }
  };

  // Charger les créneaux disponibles
  const fetchAvailableSlots = async (medecin_id, date) => {
    if (!medecin_id || !date) return;

    setLoadingSlots(true);
    try {
      const response = await appointmentService.getAvailability(medecin_id, date);
      if (response.success) {
        setAvailableSlots(response.slots);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des créneaux');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Ouvrir le modal
  const openModal = (mode, appointment = null) => {
    setModalMode(mode);
    setSelectedAppointment(appointment);
    
    if (mode === 'create') {
      setFormData({
        patient_id: user?.role === 'patient' ? user.id : '',
        medecin_id: user?.role === 'medecin' ? user.id : '',
        date: '',
        time: '',
        duree: 30,
        motif: '',
        notes: ''
      });
      setAvailableSlots([]);
    } else if (appointment) {
      const datetime = new Date(appointment.date_heure);
      const date = datetime.toISOString().split('T')[0];
      const time = datetime.toTimeString().slice(0, 5);
      
      setFormData({
        patient_id: appointment.patient_id,
        medecin_id: appointment.medecin_id,
        date,
        time,
        duree: appointment.duree,
        motif: appointment.motif || '',
        notes: appointment.notes || ''
      });
    }
    
    setShowModal(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
    setAvailableSlots([]);
  };

  // Gérer le changement de formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Charger les créneaux si médecin et date sont sélectionnés
    if (name === 'medecin_id' || name === 'date') {
      const medecin = name === 'medecin_id' ? value : formData.medecin_id;
      const date = name === 'date' ? value : formData.date;
      
      if (medecin && date) {
        fetchAvailableSlots(medecin, date);
      }
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.patient_id || !formData.medecin_id || !formData.date || !formData.time) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const datetime = `${formData.date} ${formData.time}:00`;

      const appointmentData = {
        patient_id: formData.patient_id,
        medecin_id: formData.medecin_id,
        date_heure: datetime,
        duree: parseInt(formData.duree),
        motif: formData.motif,
        notes: formData.notes
      };

      if (modalMode === 'create') {
        const response = await appointmentService.createAppointment(appointmentData);
        if (response.success) {
          toast.success('Rendez-vous créé avec succès');
          fetchAppointments();
          closeModal();
        }
      } else if (modalMode === 'edit') {
        const response = await appointmentService.updateAppointment(
          selectedAppointment.id,
          appointmentData
        );
        if (response.success) {
          toast.success('Rendez-vous mis à jour avec succès');
          fetchAppointments();
          closeModal();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Annuler un rendez-vous
  const handleCancel = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      return;
    }

    try {
      const response = await appointmentService.cancelAppointment(id);
      if (response.success) {
        toast.success('Rendez-vous annulé avec succès');
        fetchAppointments();
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'annulation');
    }
  };

  // Changer le statut
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await appointmentService.updateAppointment(id, { statut: newStatus });
      if (response.success) {
        toast.success('Statut mis à jour avec succès');
        fetchAppointments();
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  // Obtenir le badge de statut
  const getStatusBadge = (statut) => {
    const statusConfig = {
      planifie: { label: 'Planifié', class: 'badge-info', icon: <MdSchedule /> },
      confirme: { label: 'Confirmé', class: 'badge-success', icon: <MdCheckCircle /> },
      en_cours: { label: 'En cours', class: 'badge-warning', icon: <MdAccessTime /> },
      termine: { label: 'Terminé', class: 'badge-completed', icon: <MdCheckCircle /> },
      annule: { label: 'Annulé', class: 'badge-danger', icon: <MdCancel /> },
      non_presente: { label: 'Non présenté', class: 'badge-gray', icon: <MdWarning /> }
    };

    const config = statusConfig[statut] || statusConfig.planifie;

    return (
      <span className={`badge ${config.class}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Formater la date/heure
  const formatDateTime = (datetime) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // Filtrer les rendez-vous affichés
  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus === 'all') return true;
    return apt.statut === filterStatus;
  });

  return (
    <div className="appointments-page">
      {/* Header */}
      <div className="appointments-header">
        <div className="header-left">
          <h1>Gestion des Rendez-vous</h1>
          <p>{filteredAppointments.length} rendez-vous</p>
        </div>
        
        <div className="header-actions">
          {(user?.role !== 'patient' || user?.role === 'patient') && (
            <button 
              className="btn-primary"
              onClick={() => openModal('create')}
            >
              <MdAdd />
              Nouveau Rendez-vous
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="appointments-filters">
        <div className="filter-group">
          <label>Statut :</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous</option>
            <option value="planifie">Planifié</option>
            <option value="confirme">Confirmé</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
            <option value="non_presente">Non présenté</option>
          </select>
        </div>

        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            Liste
          </button>
          <button
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            Calendrier
          </button>
        </div>
      </div>

      {/* Liste des rendez-vous */}
      <div className="appointments-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <MdCalendarToday className="empty-icon" />
            <p>Aucun rendez-vous trouvé</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {filteredAppointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.date_heure);
              
              return (
                <div key={appointment.id} className="appointment-card">
                  <div className="card-header">
                    <div className="card-date">
                      <MdCalendarToday />
                      <span>{date}</span>
                    </div>
                    <div className="card-time">
                      <MdAccessTime />
                      <span>{time}</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="card-info">
                      <div className="info-row">
                        <MdPerson className="info-icon" />
                        <div>
                          <span className="info-label">Patient</span>
                          <span className="info-value">
                            {appointment.patient_nom} {appointment.patient_prenom}
                          </span>
                        </div>
                      </div>

                      <div className="info-row">
                        <MdLocalHospital className="info-icon" />
                        <div>
                          <span className="info-label">Médecin</span>
                          <span className="info-value">
                            Dr. {appointment.medecin_nom} {appointment.medecin_prenom}
                          </span>
                          {appointment.specialite && (
                            <span className="info-subtext">{appointment.specialite}</span>
                          )}
                        </div>
                      </div>

                      {appointment.motif && (
                        <div className="info-row">
                          <MdDescription className="info-icon" />
                          <div>
                            <span className="info-label">Motif</span>
                            <span className="info-value">{appointment.motif}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="card-status">
                      {getStatusBadge(appointment.statut)}
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="card-actions">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => openModal('view', appointment)}
                        title="Voir"
                      >
                        <MdVisibility />
                      </button>

                      {appointment.statut !== 'termine' && appointment.statut !== 'annule' && (
                        <>
                          {(user?.role === 'admin' || user?.role === 'receptionniste' || user?.role === 'medecin') && (
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => openModal('edit', appointment)}
                              title="Modifier"
                            >
                              <MdEdit />
                            </button>
                          )}

                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleCancel(appointment.id)}
                            title="Annuler"
                          >
                            <MdDelete />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Actions rapides de changement de statut */}
                    {(user?.role === 'admin' || user?.role === 'medecin' || user?.role === 'receptionniste') && 
                     appointment.statut !== 'termine' && appointment.statut !== 'annule' && (
                      <div className="quick-actions">
                        {appointment.statut === 'planifie' && (
                          <button
                            className="quick-action-btn"
                            onClick={() => handleStatusChange(appointment.id, 'confirme')}
                          >
                            Confirmer
                          </button>
                        )}
                        {appointment.statut === 'confirme' && (
                          <button
                            className="quick-action-btn"
                            onClick={() => handleStatusChange(appointment.id, 'en_cours')}
                          >
                            Démarrer
                          </button>
                        )}
                        {appointment.statut === 'en_cours' && (
                          <button
                            className="quick-action-btn"
                            onClick={() => handleStatusChange(appointment.id, 'termine')}
                          >
                            Terminer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === 'create' && 'Nouveau Rendez-vous'}
                {modalMode === 'edit' && 'Modifier Rendez-vous'}
                {modalMode === 'view' && 'Détails du Rendez-vous'}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <MdClose />
              </button>
            </div>

            <div className="modal-body">
              {modalMode === 'view' ? (
                // Mode Visualisation
                <div className="appointment-details">
                  <div className="detail-section">
                    <h3>Informations Générales</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Date et Heure:</span>
                        <span className="detail-value">
                          {new Date(selectedAppointment?.date_heure).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Durée:</span>
                        <span className="detail-value">{selectedAppointment?.duree} minutes</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Statut:</span>
                        <span className="detail-value">
                          {getStatusBadge(selectedAppointment?.statut)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Patient</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Nom:</span>
                        <span className="detail-value">
                          {selectedAppointment?.patient_nom} {selectedAppointment?.patient_prenom}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Téléphone:</span>
                        <span className="detail-value">{selectedAppointment?.patient_telephone}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">N° Dossier:</span>
                        <span className="detail-value">{selectedAppointment?.numero_dossier}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Médecin</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Nom:</span>
                        <span className="detail-value">
                          Dr. {selectedAppointment?.medecin_nom} {selectedAppointment?.medecin_prenom}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Spécialité:</span>
                        <span className="detail-value">{selectedAppointment?.specialite}</span>
                      </div>
                    </div>
                  </div>

                  {selectedAppointment?.motif && (
                    <div className="detail-section">
                      <h3>Motif</h3>
                      <p className="detail-text">{selectedAppointment.motif}</p>
                    </div>
                  )}

                  {selectedAppointment?.notes && (
                    <div className="detail-section">
                      <h3>Notes</h3>
                      <p className="detail-text">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                // Mode Création/Édition
                <form onSubmit={handleSubmit} className="appointment-form">
                  <div className="form-section">
                    <h3>Informations du Rendez-vous</h3>
                    
                    {user?.role !== 'patient' && (
                      <div className="form-group">
                        <label>Patient <span className="required">*</span></label>
                        <select
                          name="patient_id"
                          value={formData.patient_id}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                          disabled={loading}
                        >
                          <option value="">Sélectionner un patient</option>
                          {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>
                              {patient.nom} {patient.prenom} - {patient.numero_dossier}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {user?.role !== 'medecin' && (
                      <div className="form-group">
                        <label>Médecin <span className="required">*</span></label>
                        <select
                          name="medecin_id"
                          value={formData.medecin_id}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                          disabled={loading}
                        >
                          <option value="">Sélectionner un médecin</option>
                          {doctors.map(doctor => (
                            <option key={doctor.id} value={doctor.id}>
                              Dr. {doctor.nom} {doctor.prenom} - {doctor.specialite}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <label>Date <span className="required">*</span></label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className="form-input"
                          disabled={loading}
                        />
                      </div>

                      <div className="form-group">
                        <label>Durée (minutes)</label>
                        <select
                          name="duree"
                          value={formData.duree}
                          onChange={handleInputChange}
                          className="form-input"
                          disabled={loading}
                        >
                          <option value="15">15 min</option>
                          <option value="30">30 min</option>
                          <option value="45">45 min</option>
                          <option value="60">1 heure</option>
                          <option value="90">1h30</option>
                          <option value="120">2 heures</option>
                        </select>
                      </div>
                    </div>

                    {/* Créneaux disponibles */}
                    {formData.medecin_id && formData.date && (
                      <div className="form-group">
                        <label>Heure <span className="required">*</span></label>
                        {loadingSlots ? (
                          <div className="loading-slots">
                            <div className="spinner-small"></div>
                            <span>Chargement des créneaux...</span>
                          </div>
                        ) : availableSlots.length > 0 ? (
                          <div className="time-slots">
                            {availableSlots.map((slot, index) => (
                              <button
                                key={index}
                                type="button"
                                className={`time-slot ${formData.time === slot.time ? 'selected' : ''}`}
                                onClick={() => setFormData(prev => ({ ...prev, time: slot.time }))}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="no-slots">Aucun créneau disponible pour cette date</p>
                        )}
                      </div>
                    )}

                    <div className="form-group">
                      <label>Motif de la consultation</label>
                      <textarea
                        name="motif"
                        value={formData.motif}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Décrivez le motif de la consultation..."
                        className="form-input"
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label>Notes (optionnel)</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="2"
                        placeholder="Notes supplémentaires..."
                        className="form-input"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={closeModal}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading || !formData.time}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-small"></span>
                          Enregistrement...
                        </>
                      ) : (
                        modalMode === 'create' ? 'Créer' : 'Mettre à jour'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;