import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import doctorService from '../services/doctorService';
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
  MdLocalHospital,
  MdVerifiedUser
} from 'react-icons/md';
import './Doctors.css';

const Doctors = () => {
  const { user } = useAuth();
  
  // États
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    date_naissance: '',
    sexe: '',
    adresse: '',
    specialite: '',
    numero_licence: '',
    statut: 'actif'
  });

  // Charger les médecins au montage
  useEffect(() => {
    fetchDoctors();
  }, [currentPage, searchTerm]);

  // Récupérer les médecins
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await doctorService.getAllDoctors({
        search: searchTerm,
        page: currentPage,
        limit: 10
      });

      if (response.success) {
        setDoctors(response.data);
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
  const openModal = (mode, doctor = null) => {
    setModalMode(mode);
    setSelectedDoctor(doctor);
    
    if (mode === 'create') {
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        date_naissance: '',
        sexe: '',
        adresse: '',
        specialite: '',
        numero_licence: '',
        statut: 'actif'
      });
    } else if (doctor) {
      setFormData({
        nom: doctor.nom || '',
        prenom: doctor.prenom || '',
        email: doctor.email || '',
        telephone: doctor.telephone || '',
        date_naissance: doctor.date_naissance || '',
        sexe: doctor.sexe || '',
        adresse: doctor.adresse || '',
        specialite: doctor.specialite || '',
        numero_licence: doctor.numero_licence || '',
        statut: doctor.statut || 'actif'
      });
    }
    
    setShowModal(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedDoctor(null);
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
    if (!formData.nom || !formData.prenom || !formData.email || !formData.specialite) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      if (modalMode === 'create') {
        const response = await doctorService.createDoctor(formData);
        if (response.success) {
          toast.success(`Médecin créé avec succès. Mot de passe temporaire: ${response.data.password_temporaire}`);
          fetchDoctors();
          closeModal();
        }
      } else if (modalMode === 'edit') {
        const response = await doctorService.updateDoctor(selectedDoctor.id, formData);
        if (response.success) {
          toast.success('Médecin mis à jour avec succès');
          fetchDoctors();
          closeModal();
        }
      }
    } catch (error) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un médecin
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
      return;
    }

    try {
      const response = await doctorService.deleteDoctor(id);
      if (response.success) {
        toast.success('Médecin supprimé avec succès');
        fetchDoctors();
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
    <div className="doctors-page">
      {/* Header */}
      <div className="doctors-header">
        <div className="header-left">
          <h1>Gestion des Médecins</h1>
          <p>{doctors.length} médecin(s) trouvé(s)</p>
        </div>
        
        {user?.role === 'admin' && (
          <button 
            className="btn-primary"
            onClick={() => openModal('create')}
          >
            <MdAdd />
            Nouveau Médecin
          </button>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="search-bar">
        <MdSearch className="search-icon" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom, email, spécialité..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* Tableau des médecins */}
      <div className="doctors-table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <MdPerson className="empty-icon" />
            <p>Aucun médecin trouvé</p>
          </div>
        ) : (
          <table className="doctors-table">
            <thead>
              <tr>
                <th>Nom Complet</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Spécialité</th>
                <th>N° Licence</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>
                    <div className="doctor-name">
                      <strong>{doctor.nom} {doctor.prenom}</strong>
                      {doctor.sexe && (
                        <span className="doctor-gender">
                          {doctor.sexe === 'M' ? 'Dr.' : 'Dr.'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{doctor.email}</td>
                  <td>{doctor.telephone || '-'}</td>
                  <td>
                    <span className="specialite-badge">
                      {doctor.specialite || '-'}
                    </span>
                  </td>
                  <td>
                    {doctor.numero_licence ? (
                      <span className="licence-number">{doctor.numero_licence}</span>
                    ) : '-'}
                  </td>
                  <td>
                    <span className={`badge badge-${doctor.statut === 'actif' ? 'success' : 'danger'}`}>
                      {doctor.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => openModal('view', doctor)}
                        title="Voir"
                      >
                        <MdVisibility />
                      </button>
                      
                      {user?.role === 'admin' && (
                        <>
                          <button
                            className="btn-icon btn-edit"
                            onClick={() => openModal('edit', doctor)}
                            title="Modifier"
                          >
                            <MdEdit />
                          </button>
                          
                          <button
                            className="btn-icon btn-delete"
                            onClick={() => handleDelete(doctor.id)}
                            title="Supprimer"
                          >
                            <MdDelete />
                          </button>
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
                {modalMode === 'create' && 'Nouveau Médecin'}
                {modalMode === 'edit' && 'Modifier Médecin'}
                {modalMode === 'view' && 'Détails du Médecin'}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <MdClose />
              </button>
            </div>

            {/* Body du modal */}
            <div className="modal-body">
              {modalMode === 'view' ? (
                // Mode Visualisation
                <div className="doctor-details">
                  <div className="detail-section">
                    <h3>Informations Personnelles</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Nom Complet:</span>
                        <span className="detail-value">Dr. {selectedDoctor?.nom} {selectedDoctor?.prenom}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{selectedDoctor?.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Téléphone:</span>
                        <span className="detail-value">{selectedDoctor?.telephone || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Date de Naissance:</span>
                        <span className="detail-value">
                          {selectedDoctor?.date_naissance 
                            ? new Date(selectedDoctor.date_naissance).toLocaleDateString('fr-FR')
                            : '-'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Sexe:</span>
                        <span className="detail-value">
                          {selectedDoctor?.sexe === 'M' ? 'Homme' : selectedDoctor?.sexe === 'F' ? 'Femme' : '-'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Adresse:</span>
                        <span className="detail-value">{selectedDoctor?.adresse || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Informations Professionnelles</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Spécialité:</span>
                        <span className="detail-value">{selectedDoctor?.specialite || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">N° Licence:</span>
                        <span className="detail-value">{selectedDoctor?.numero_licence || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Statut:</span>
                        <span className="detail-value">
                          <span className={`badge badge-${selectedDoctor?.statut === 'actif' ? 'success' : 'danger'}`}>
                            {selectedDoctor?.statut === 'actif' ? 'Actif' : 'Inactif'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Mode Création/Édition
                <form onSubmit={handleSubmit} className="doctor-form">
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
                        <label>Email <span className="required">*</span></label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
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
                        <label>Date de Naissance</label>
                        <input
                          type="date"
                          name="date_naissance"
                          value={formData.date_naissance}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Sexe</label>
                        <select
                          name="sexe"
                          value={formData.sexe}
                          onChange={handleInputChange}
                          className="form-input"
                        >
                          <option value="">Sélectionner</option>
                          <option value="M">Homme</option>
                          <option value="F">Femme</option>
                        </select>
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
                    <h3>Informations Professionnelles</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label>Spécialité <span className="required">*</span></label>
                        <select
                          name="specialite"
                          value={formData.specialite}
                          onChange={handleInputChange}
                          required
                          className="form-input"
                        >
                          <option value="">Sélectionner</option>
                          <option value="Cardiologie">Cardiologie</option>
                          <option value="Dermatologie">Dermatologie</option>
                          <option value="Gynécologie">Gynécologie</option>
                          <option value="Pédiatrie">Pédiatrie</option>
                          <option value="Neurologie">Neurologie</option>
                          <option value="Ophtalmologie">Ophtalmologie</option>
                          <option value="Orthopédie">Orthopédie</option>
                          <option value="Psychiatrie">Psychiatrie</option>
                          <option value="Radiologie">Radiologie</option>
                          <option value="Chirurgie Générale">Chirurgie Générale</option>
                          <option value="Médecine Générale">Médecine Générale</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label>N° Licence</label>
                        <input
                          type="text"
                          name="numero_licence"
                          value={formData.numero_licence}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Ex: MED-12345"
                        />
                      </div>
                    </div>

                    {modalMode === 'edit' && (
                      <div className="form-group">
                        <label>Statut</label>
                        <select
                          name="statut"
                          value={formData.statut}
                          onChange={handleInputChange}
                          className="form-input"
                        >
                          <option value="actif">Actif</option>
                          <option value="inactif">Inactif</option>
                          <option value="suspendu">Suspendu</option>
                        </select>
                      </div>
                    )}
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

export default Doctors;