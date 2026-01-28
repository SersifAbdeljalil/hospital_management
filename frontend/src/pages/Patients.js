import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import patientService from '../services/patientService';
import useAuth from '../hooks/useAuth';
import {
  MdSearch,
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdVisibility,
  MdPerson,
  MdEmail,
  MdPhone,
  MdCake,
  MdLocationOn,
  MdBloodtype,
  MdContactPhone
} from 'react-icons/md';
import './Patients.css';

const Patients = () => {
  const { user } = useAuth();
  
  // États
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    date_naissance: '',
    sexe: '',
    adresse: '',
    groupe_sanguin: '',
    numero_securite_sociale: '',
    contact_urgence_nom: '',
    contact_urgence_telephone: '',
    contact_urgence_relation: '',
    profession: '',
    situation_familiale: '',
    assurance_nom: '',
    assurance_numero: ''
  });

  // Charger les patients au montage
  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchTerm]);

  // Récupérer les patients
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await patientService.getAllPatients({
        search: searchTerm,
        page: currentPage,
        limit: 10
      });

      if (response.success) {
        setPatients(response.data);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // Gérer la recherche
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Ouvrir le modal
  const openModal = (mode, patient = null) => {
    setModalMode(mode);
    setSelectedPatient(patient);
    
    if (mode === 'create') {
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        date_naissance: '',
        sexe: '',
        adresse: '',
        groupe_sanguin: '',
        numero_securite_sociale: '',
        contact_urgence_nom: '',
        contact_urgence_telephone: '',
        contact_urgence_relation: '',
        profession: '',
        situation_familiale: '',
        assurance_nom: '',
        assurance_numero: ''
      });
    } else if (patient) {
      setFormData({
        nom: patient.nom || '',
        prenom: patient.prenom || '',
        email: patient.email || '',
        telephone: patient.telephone || '',
        date_naissance: patient.date_naissance || '',
        sexe: patient.sexe || '',
        adresse: patient.adresse || '',
        groupe_sanguin: patient.groupe_sanguin || '',
        numero_securite_sociale: patient.numero_securite_sociale || '',
        contact_urgence_nom: patient.contact_urgence_nom || '',
        contact_urgence_telephone: patient.contact_urgence_telephone || '',
        contact_urgence_relation: patient.contact_urgence_relation || '',
        profession: patient.profession || '',
        situation_familiale: patient.situation_familiale || '',
        assurance_nom: patient.assurance_nom || '',
        assurance_numero: patient.assurance_numero || ''
      });
    }
    
    setShowModal(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedPatient(null);
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
    if (!formData.nom || !formData.prenom || !formData.date_naissance || !formData.sexe) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      if (modalMode === 'create') {
        const response = await patientService.createPatient(formData);
        if (response.success) {
          toast.success('Patient créé avec succès');
          fetchPatients();
          closeModal();
        }
      } else if (modalMode === 'edit') {
        const response = await patientService.updatePatient(selectedPatient.id, formData);
        if (response.success) {
          toast.success('Patient mis à jour avec succès');
          fetchPatients();
          closeModal();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un patient
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) {
      return;
    }

    try {
      const response = await patientService.deletePatient(id);
      if (response.success) {
        toast.success('Patient supprimé avec succès');
        fetchPatients();
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  // Calculer l'âge
  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="patients-page">
      {/* Header */}
      <div className="patients-header">
        <div className="header-left">
          <h1>Gestion des Patients</h1>
          <p>{patients.length} patient(s) trouvé(s)</p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'receptionniste') && (
          <button 
            className="btn-primary"
            onClick={() => openModal('create')}
          >
            <MdAdd />
            Nouveau Patient
          </button>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="search-bar">
        <MdSearch className="search-icon" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom, numéro de dossier, email..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* Tableau des patients */}
      <div className="patients-table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <MdPerson className="empty-icon" />
            <p>Aucun patient trouvé</p>
          </div>
        ) : (
          <table className="patients-table">
            <thead>
              <tr>
                <th>N° Dossier</th>
                <th>Nom Complet</th>
                <th>Date de Naissance</th>
                <th>Âge</th>
                <th>Sexe</th>
                <th>Téléphone</th>
                <th>Groupe Sanguin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <span className="numero-dossier">{patient.numero_dossier}</span>
                  </td>
                  <td>
                    <div className="patient-name">
                      <strong>{patient.nom} {patient.prenom}</strong>
                      <span className="patient-email">{patient.email}</span>
                    </div>
                  </td>
                  <td>{new Date(patient.date_naissance).toLocaleDateString('fr-FR')}</td>
                  <td>{calculateAge(patient.date_naissance)} ans</td>
                  <td>
                    <span className={`badge badge-${patient.sexe === 'M' ? 'blue' : 'pink'}`}>
                      {patient.sexe === 'M' ? 'Homme' : 'Femme'}
                    </span>
                  </td>
                  <td>{patient.telephone || '-'}</td>
                  <td>
                    {patient.groupe_sanguin ? (
                      <span className="blood-group">{patient.groupe_sanguin}</span>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => openModal('view', patient)}
                        title="Voir"
                      >
                        <MdVisibility />
                      </button>
                      
                      {(user?.role === 'admin' || user?.role === 'receptionniste') && (
                        <>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => openModal('edit', patient)}
                            title="Modifier"
                          >
                            <MdEdit />
                          </button>
                          
                          {user?.role === 'admin' && (
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => handleDelete(patient.id)}
                              title="Supprimer"
                            >
                              <MdDelete />
                            </button>
                          )}
                        </>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Header du modal */}
            <div className="modal-header">
              <h2>
                {modalMode === 'create' && 'Nouveau Patient'}
                {modalMode === 'edit' && 'Modifier Patient'}
                {modalMode === 'view' && 'Détails du Patient'}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <MdClose />
              </button>
            </div>

            {/* Body du modal */}
            <div className="modal-body">
              {modalMode === 'view' ? (
                // Mode Visualisation
                <div className="patient-details">
                  <div className="detail-section">
                    <h3>Informations Personnelles</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">N° Dossier:</span>
                        <span className="detail-value">{selectedPatient?.numero_dossier}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Nom Complet:</span>
                        <span className="detail-value">{selectedPatient?.nom} {selectedPatient?.prenom}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{selectedPatient?.email || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Téléphone:</span>
                        <span className="detail-value">{selectedPatient?.telephone || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Date de Naissance:</span>
                        <span className="detail-value">
                          {new Date(selectedPatient?.date_naissance).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Âge:</span>
                        <span className="detail-value">{calculateAge(selectedPatient?.date_naissance)} ans</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Sexe:</span>
                        <span className="detail-value">{selectedPatient?.sexe === 'M' ? 'Homme' : 'Femme'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Groupe Sanguin:</span>
                        <span className="detail-value">{selectedPatient?.groupe_sanguin || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Contact d'Urgence</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Nom:</span>
                        <span className="detail-value">{selectedPatient?.contact_urgence_nom || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Téléphone:</span>
                        <span className="detail-value">{selectedPatient?.contact_urgence_telephone || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Relation:</span>
                        <span className="detail-value">{selectedPatient?.contact_urgence_relation || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Mode Création/Édition
                <form onSubmit={handleSubmit} className="patient-form">
                  <div className="form-section">
                    <h3>Informations Personnelles</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom <span className="required">*</span></label>
                        <input
                          type="text"
                          name="nom"
                          value={formData.nom}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Prénom <span className="required">*</span></label>
                        <input
                          type="text"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Téléphone</label>
                        <input
                          type="tel"
                          name="telephone"
                          value={formData.telephone}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Date de Naissance <span className="required">*</span></label>
                        <input
                          type="date"
                          name="date_naissance"
                          value={formData.date_naissance}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Sexe <span className="required">*</span></label>
                        <select
                          name="sexe"
                          value={formData.sexe}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        >
                          <option value="">Sélectionner</option>
                          <option value="M">Homme</option>
                          <option value="F">Femme</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Groupe Sanguin</label>
                        <select
                          name="groupe_sanguin"
                          value={formData.groupe_sanguin}
                          onChange={handleInputChange}
                          className="form-input"
                        >
                          <option value="">Sélectionner</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>N° Sécurité Sociale</label>
                        <input
                          type="text"
                          name="numero_securite_sociale"
                          value={formData.numero_securite_sociale}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Adresse</label>
                      <textarea
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleInputChange}
                        rows="2"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Contact d'Urgence</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom du Contact</label>
                        <input
                          type="text"
                          name="contact_urgence_nom"
                          value={formData.contact_urgence_nom}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Téléphone</label>
                        <input
                          type="tel"
                          name="contact_urgence_telephone"
                          value={formData.contact_urgence_telephone}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Relation</label>
                      <input
                        type="text"
                        name="contact_urgence_relation"
                        value={formData.contact_urgence_relation}
                        onChange={handleInputChange}
                        placeholder="Ex: Conjoint, Parent, Ami..."
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Informations Complémentaires</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Profession</label>
                        <input
                          type="text"
                          name="profession"
                          value={formData.profession}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Situation Familiale</label>
                        <select
                          name="situation_familiale"
                          value={formData.situation_familiale}
                          onChange={handleInputChange}
                          className="form-input"
                        >
                          <option value="">Sélectionner</option>
                          <option value="celibataire">Célibataire</option>
                          <option value="marie">Marié(e)</option>
                          <option value="divorce">Divorcé(e)</option>
                          <option value="veuf">Veuf/Veuve</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Nom de l'Assurance</label>
                        <input
                          type="text"
                          name="assurance_nom"
                          value={formData.assurance_nom}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>N° Assurance</label>
                        <input
                          type="text"
                          name="assurance_numero"
                          value={formData.assurance_numero}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
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

export default Patients;