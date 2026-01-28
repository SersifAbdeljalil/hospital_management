import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import consultationService from '../services/consultationService';
import patientService from '../services/patientService';
import useAuth from '../hooks/useAuth';
import {
  MdSearch,
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdVisibility,
  MdCheckCircle,
  MdPerson,
  MdLocalHospital,
  MdCalendarToday,
  MdDescription,
  MdMonitorHeart,
  MdScience
} from 'react-icons/md';
import './Consultations.css';

const Consultations = () => {
  const { user } = useAuth();
  
  // États
  const [consultations, setConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    date_consultation: new Date().toISOString().slice(0, 16),
    motif_consultation: '',
    // Constantes vitales
    temperature: '',
    tension_arterielle_systolique: '',
    tension_arterielle_diastolique: '',
    frequence_cardiaque: '',
    frequence_respiratoire: '',
    poids: '',
    taille: '',
    saturation_oxygene: '',
    // Examen et diagnostic
    examen_clinique: '',
    symptomes: '',
    diagnostic: '',
    diagnostic_code_cim10: '',
    observations: '',
    // Traitement
    examens_demandes: '',
    traitement_propose: '',
    conduite_a_tenir: '',
    prochain_rdv_recommande: '',
    arret_travail_jours: ''
  });

  // Charger les consultations au montage
  useEffect(() => {
    fetchConsultations();
    if (user?.role === 'medecin' || user?.role === 'admin') {
      fetchPatients();
    }
  }, [currentPage, searchTerm]);

  // Récupérer les consultations
  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const response = await consultationService.getAllConsultations({
        search: searchTerm,
        page: currentPage,
        limit: 10
      });

      if (response.success) {
        setConsultations(response.data);
        setTotalPages(response.pagination.pages);
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

  // Gérer la recherche
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Ouvrir le modal
  const openModal = (mode, consultation = null) => {
    setModalMode(mode);
    setSelectedConsultation(consultation);
    
    if (mode === 'create') {
      setFormData({
        patient_id: '',
        date_consultation: new Date().toISOString().slice(0, 16),
        motif_consultation: '',
        temperature: '',
        tension_arterielle_systolique: '',
        tension_arterielle_diastolique: '',
        frequence_cardiaque: '',
        frequence_respiratoire: '',
        poids: '',
        taille: '',
        saturation_oxygene: '',
        examen_clinique: '',
        symptomes: '',
        diagnostic: '',
        diagnostic_code_cim10: '',
        observations: '',
        examens_demandes: '',
        traitement_propose: '',
        conduite_a_tenir: '',
        prochain_rdv_recommande: '',
        arret_travail_jours: ''
      });
    } else if (consultation && mode === 'edit') {
      setFormData({
        patient_id: consultation.patient_id || '',
        date_consultation: consultation.date_consultation || '',
        motif_consultation: consultation.motif_consultation || '',
        temperature: consultation.temperature || '',
        tension_arterielle_systolique: consultation.tension_arterielle_systolique || '',
        tension_arterielle_diastolique: consultation.tension_arterielle_diastolique || '',
        frequence_cardiaque: consultation.frequence_cardiaque || '',
        frequence_respiratoire: consultation.frequence_respiratoire || '',
        poids: consultation.poids || '',
        taille: consultation.taille || '',
        saturation_oxygene: consultation.saturation_oxygene || '',
        examen_clinique: consultation.examen_clinique || '',
        symptomes: consultation.symptomes || '',
        diagnostic: consultation.diagnostic || '',
        diagnostic_code_cim10: consultation.diagnostic_code_cim10 || '',
        observations: consultation.observations || '',
        examens_demandes: consultation.examens_demandes || '',
        traitement_propose: consultation.traitement_propose || '',
        conduite_a_tenir: consultation.conduite_a_tenir || '',
        prochain_rdv_recommande: consultation.prochain_rdv_recommande || '',
        arret_travail_jours: consultation.arret_travail_jours || ''
      });
    }
    
    setShowModal(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedConsultation(null);
  };

  // Gérer le changement de formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.patient_id || !formData.date_consultation) {
      toast.error('Patient et date de consultation sont requis');
      return;
    }

    setLoading(true);

    try {
      if (modalMode === 'create') {
        const response = await consultationService.createConsultation(formData);
        if (response.success) {
          toast.success('Consultation créée avec succès');
          fetchConsultations();
          closeModal();
        }
      } else if (modalMode === 'edit') {
        const response = await consultationService.updateConsultation(
          selectedConsultation.id,
          formData
        );
        if (response.success) {
          toast.success('Consultation mise à jour avec succès');
          fetchConsultations();
          closeModal();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Terminer une consultation
  const handleTerminer = async (id) => {
    if (!window.confirm('Voulez-vous marquer cette consultation comme terminée ?')) {
      return;
    }

    try {
      const response = await consultationService.terminerConsultation(id);
      if (response.success) {
        toast.success('Consultation terminée avec succès');
        fetchConsultations();
      }
    } catch (error) {
      toast.error(error.message || 'Erreur');
    }
  };

  // Supprimer une consultation
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette consultation ?')) {
      return;
    }

    try {
      const response = await consultationService.deleteConsultation(id);
      if (response.success) {
        toast.success('Consultation supprimée avec succès');
        fetchConsultations();
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  // Calculer l'IMC
  const calculateIMC = () => {
    const poids = parseFloat(formData.poids);
    const taille = parseFloat(formData.taille);
    if (poids && taille) {
      const tailleM = taille / 100;
      return (poids / (tailleM * tailleM)).toFixed(2);
    }
    return '-';
  };

  return (
    <div className="consultations-page">
      {/* Header */}
      <div className="consultations-header">
        <div className="header-left">
          <h1>Gestion des Consultations</h1>
          <p>{consultations.length} consultation(s) trouvée(s)</p>
        </div>
        
        {(user?.role === 'medecin' || user?.role === 'infirmier') && (
          <button 
            className="btn-primary"
            onClick={() => openModal('create')}
          >
            <MdAdd />
            Nouvelle Consultation
          </button>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="search-bar">
        <MdSearch className="search-icon" />
        <input
          type="text"
          placeholder="Rechercher par patient, diagnostic, numéro de dossier..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* Tableau des consultations */}
      <div className="consultations-table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : consultations.length === 0 ? (
          <div className="empty-state">
            <MdLocalHospital className="empty-icon" />
            <p>Aucune consultation trouvée</p>
          </div>
        ) : (
          <table className="consultations-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Médecin</th>
                <th>Motif</th>
                <th>Diagnostic</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((consultation) => (
                <tr key={consultation.id}>
                  <td>
                    <div className="consultation-date">
                      <MdCalendarToday />
                      <span>
                        {new Date(consultation.date_consultation).toLocaleDateString('fr-FR')}
                      </span>
                      <small>
                        {new Date(consultation.date_consultation).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div className="patient-info">
                      <strong>{consultation.patient_nom} {consultation.patient_prenom}</strong>
                      <span className="numero-dossier">{consultation.numero_dossier}</span>
                    </div>
                  </td>
                  <td>
                    <div className="medecin-info">
                      <strong>Dr. {consultation.medecin_nom} {consultation.medecin_prenom}</strong>
                      <span className="specialite">{consultation.specialite}</span>
                    </div>
                  </td>
                  <td>{consultation.motif_consultation || '-'}</td>
                  <td>
                    {consultation.diagnostic ? (
                      <span className="diagnostic-badge">{consultation.diagnostic}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${consultation.statut}`}>
                      {consultation.statut === 'en_cours' && 'En cours'}
                      {consultation.statut === 'terminee' && 'Terminée'}
                      {consultation.statut === 'annulee' && 'Annulée'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => openModal('view', consultation)}
                        title="Voir"
                      >
                        <MdVisibility />
                      </button>
                      
                      {user?.role === 'medecin' && consultation.statut === 'en_cours' && (
                        <>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => openModal('edit', consultation)}
                            title="Modifier"
                          >
                            <MdEdit />
                          </button>
                          
                          <button
                            className="btn-icon btn-success"
                            onClick={() => handleTerminer(consultation.id)}
                            title="Terminer"
                          >
                            <MdCheckCircle />
                          </button>
                        </>
                      )}
                      
                      {user?.role === 'admin' && (
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDelete(consultation.id)}
                          title="Supprimer"
                        >
                          <MdDelete />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </button>
          
          <span className="pagination-info">
            Page {currentPage} sur {totalPages}
          </span>
          
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            {/* Header du modal */}
            <div className="modal-header">
              <h2>
                {modalMode === 'create' && 'Nouvelle Consultation'}
                {modalMode === 'edit' && 'Modifier Consultation'}
                {modalMode === 'view' && 'Détails de la Consultation'}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <MdClose />
              </button>
            </div>

            {/* Body du modal */}
            <div className="modal-body">
              {modalMode === 'view' ? (
                // Mode Visualisation
                <div className="consultation-details">
                  <div className="detail-section">
                    <h3><MdPerson /> Informations Générales</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Patient:</span>
                        <span className="detail-value">
                          {selectedConsultation?.patient_nom} {selectedConsultation?.patient_prenom}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Médecin:</span>
                        <span className="detail-value">
                          Dr. {selectedConsultation?.medecin_nom} {selectedConsultation?.medecin_prenom}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">
                          {new Date(selectedConsultation?.date_consultation).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Motif:</span>
                        <span className="detail-value">{selectedConsultation?.motif_consultation || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3><MdMonitorHeart /> Constantes Vitales</h3>
                    <div className="detail-grid detail-grid-3">
                      <div className="detail-item">
                        <span className="detail-label">Température:</span>
                        <span className="detail-value">{selectedConsultation?.temperature ? `${selectedConsultation.temperature}°C` : '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Tension Artérielle:</span>
                        <span className="detail-value">
                          {selectedConsultation?.tension_arterielle_systolique && selectedConsultation?.tension_arterielle_diastolique
                            ? `${selectedConsultation.tension_arterielle_systolique}/${selectedConsultation.tension_arterielle_diastolique} mmHg`
                            : '-'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Fréquence Cardiaque:</span>
                        <span className="detail-value">{selectedConsultation?.frequence_cardiaque ? `${selectedConsultation.frequence_cardiaque} bpm` : '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Poids:</span>
                        <span className="detail-value">{selectedConsultation?.poids ? `${selectedConsultation.poids} kg` : '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Taille:</span>
                        <span className="detail-value">{selectedConsultation?.taille ? `${selectedConsultation.taille} cm` : '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">IMC:</span>
                        <span className="detail-value">{selectedConsultation?.imc || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Saturation O2:</span>
                        <span className="detail-value">{selectedConsultation?.saturation_oxygene ? `${selectedConsultation.saturation_oxygene}%` : '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3><MdScience /> Examen et Diagnostic</h3>
                    <div className="detail-text">
                      <div className="detail-item">
                        <span className="detail-label">Symptômes:</span>
                        <p className="detail-value">{selectedConsultation?.symptomes || '-'}</p>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Examen Clinique:</span>
                        <p className="detail-value">{selectedConsultation?.examen_clinique || '-'}</p>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Diagnostic:</span>
                        <p className="detail-value diagnostic-highlight">{selectedConsultation?.diagnostic || '-'}</p>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Code CIM-10:</span>
                        <span className="detail-value">{selectedConsultation?.diagnostic_code_cim10 || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3><MdDescription /> Traitement et Suivi</h3>
                    <div className="detail-text">
                      <div className="detail-item">
                        <span className="detail-label">Examens Demandés:</span>
                        <p className="detail-value">{selectedConsultation?.examens_demandes || '-'}</p>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Traitement Proposé:</span>
                        <p className="detail-value">{selectedConsultation?.traitement_propose || '-'}</p>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Conduite à Tenir:</span>
                        <p className="detail-value">{selectedConsultation?.conduite_a_tenir || '-'}</p>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Observations:</span>
                        <p className="detail-value">{selectedConsultation?.observations || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Mode Création/Édition
                <form onSubmit={handleSubmit} className="consultation-form">
                  <div className="form-section">
                    <h3>Informations Générales</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Patient <span className="required">*</span></label>
                        <select
                          name="patient_id"
                          value={formData.patient_id}
                          onChange={handleInputChange}
                          required
                          disabled={modalMode === 'edit'}
                          className="form-input"
                        >
                          <option value="">Sélectionner un patient</option>
                          {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>
                              {patient.nom} {patient.prenom} - {patient.numero_dossier}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>Date et Heure <span className="required">*</span></label>
                        <input
                          type="datetime-local"
                          name="date_consultation"
                          value={formData.date_consultation}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Motif de Consultation</label>
                      <textarea
                        name="motif_consultation"
                        value={formData.motif_consultation}
                        onChange={handleInputChange}
                        rows="2"
                        className="form-input"
                        placeholder="Raison de la consultation..."
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Constantes Vitales</h3>
                    
                    <div className="form-row form-row-3">
                      <div className="form-group">
                        <label>Température (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          name="temperature"
                          value={formData.temperature}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="37.5"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>TA Systolique (mmHg)</label>
                        <input
                          type="number"
                          name="tension_arterielle_systolique"
                          value={formData.tension_arterielle_systolique}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="120"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>TA Diastolique (mmHg)</label>
                        <input
                          type="number"
                          name="tension_arterielle_diastolique"
                          value={formData.tension_arterielle_diastolique}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="80"
                        />
                      </div>
                    </div>

                    <div className="form-row form-row-3">
                      <div className="form-group">
                        <label>Fréquence Cardiaque (bpm)</label>
                        <input
                          type="number"
                          name="frequence_cardiaque"
                          value={formData.frequence_cardiaque}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="70"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Fréquence Respiratoire</label>
                        <input
                          type="number"
                          name="frequence_respiratoire"
                          value={formData.frequence_respiratoire}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="16"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Saturation O2 (%)</label>
                        <input
                          type="number"
                          name="saturation_oxygene"
                          value={formData.saturation_oxygene}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="98"
                        />
                      </div>
                    </div>

                    <div className="form-row form-row-3">
                      <div className="form-group">
                        <label>Poids (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          name="poids"
                          value={formData.poids}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="70"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Taille (cm)</label>
                        <input
                          type="number"
                          name="taille"
                          value={formData.taille}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="175"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>IMC</label>
                        <input
                          type="text"
                          value={calculateIMC()}
                          readOnly
                          className="form-input"
                          style={{ background: '#F5F5F5' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Examen et Diagnostic</h3>
                    
                    <div className="form-group">
                      <label>Symptômes</label>
                      <textarea
                        name="symptomes"
                        value={formData.symptomes}
                        onChange={handleInputChange}
                        rows="3"
                        className="form-input"
                        placeholder="Description des symptômes..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Examen Clinique</label>
                      <textarea
                        name="examen_clinique"
                        value={formData.examen_clinique}
                        onChange={handleInputChange}
                        rows="3"
                        className="form-input"
                        placeholder="Résultats de l'examen clinique..."
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Diagnostic</label>
                        <textarea
                          name="diagnostic"
                          value={formData.diagnostic}
                          onChange={handleInputChange}
                          rows="2"
                          className="form-input"
                          placeholder="Diagnostic médical..."
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Code CIM-10</label>
                        <input
                          type="text"
                          name="diagnostic_code_cim10"
                          value={formData.diagnostic_code_cim10}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Ex: J06.9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Traitement et Suivi</h3>
                    
                    <div className="form-group">
                      <label>Examens Demandés</label>
                      <textarea
                        name="examens_demandes"
                        value={formData.examens_demandes}
                        onChange={handleInputChange}
                        rows="2"
                        className="form-input"
                        placeholder="Liste des examens complémentaires..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Traitement Proposé</label>
                      <textarea
                        name="traitement_propose"
                        value={formData.traitement_propose}
                        onChange={handleInputChange}
                        rows="3"
                        className="form-input"
                        placeholder="Description du traitement..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Conduite à Tenir</label>
                      <textarea
                        name="conduite_a_tenir"
                        value={formData.conduite_a_tenir}
                        onChange={handleInputChange}
                        rows="2"
                        className="form-input"
                        placeholder="Recommandations pour le patient..."
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Prochain RDV Recommandé</label>
                        <input
                          type="date"
                          name="prochain_rdv_recommande"
                          value={formData.prochain_rdv_recommande}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Arrêt de Travail (jours)</label>
                        <input
                          type="number"
                          name="arret_travail_jours"
                          value={formData.arret_travail_jours}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Observations</label>
                      <textarea
                        name="observations"
                        value={formData.observations}
                        onChange={handleInputChange}
                        rows="2"
                        className="form-input"
                        placeholder="Observations générales..."
                      />
                    </div>
                  </div>

                  {/* Boutons du formulaire */}
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
                      disabled={loading}
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

export default Consultations;