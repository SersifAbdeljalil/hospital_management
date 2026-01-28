import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import prescriptionService from '../services/Prescriptionservice';
// ⚠️ CHANGEMENT ICI: Importer myPatientService au lieu de patientService
import myPatientService from '../services/myPatientService';
import useAuth from '../hooks/useAuth';
import {
  MdAdd,
  MdClose,
  MdDelete,
  MdDownload,
  MdEdit,
  MdFilterList,
  MdRefresh,
  MdSearch,
  MdVisibility,
  MdPayment,
  MdPerson,
  MdCalendarToday,
  MdMedication,
  MdLocalHospital,
  MdCheckCircle,
  MdWarning,
  MdCancel
} from 'react-icons/md';
import './Prescriptions.css';

const Prescriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // États principaux
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // États pour les filtres
  const [filters, setFilters] = useState({
    statut: '',
    patient_id: '',
    date_debut: '',
    date_fin: '',
    search: ''
  });

  // États pour les modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // États pour le formulaire de création
  const [formData, setFormData] = useState({
    patient_id: '',
    consultation_id: '',
    diagnostic: '',
    instructions: '',
    duree_traitement: ''
  });

  const [medicaments, setMedicaments] = useState([
    { nom: '', dosage: '', forme: 'comprimé', posologie: '', duree: '' }
  ]);

  const [invoiceAmount, setInvoiceAmount] = useState('');

  useEffect(() => {
    fetchPrescriptions();
    fetchPatients();
  }, [filters]);

  // Récupérer les ordonnances
  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await prescriptionService.getDoctorPrescriptions(filters);
      if (response.success) {
        setPrescriptions(response.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des ordonnances');
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ CHANGEMENT ICI: Utiliser myPatientService
  const fetchPatients = async () => {
    try {
      const response = await myPatientService.getMyPatients();
      if (response.success) {
        setPatients(response.data);
        console.log('Patients chargés:', response.data); // Debug
      }
    } catch (error) {
      console.error('Erreur chargement patients:', error);
      toast.error('Erreur lors du chargement des patients');
    }
  };

  // Actualiser
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    await fetchPatients();
    setRefreshing(false);
    toast.success('Liste actualisée');
  };

  // Ajouter un médicament
  const handleAddMedicament = () => {
    setMedicaments([...medicaments, { nom: '', dosage: '', forme: 'comprimé', posologie: '', duree: '' }]);
  };

  // Supprimer un médicament
  const handleRemoveMedicament = (index) => {
    const newMedicaments = medicaments.filter((_, i) => i !== index);
    setMedicaments(newMedicaments);
  };

  // Modifier un médicament
  const handleMedicamentChange = (index, field, value) => {
    const newMedicaments = [...medicaments];
    newMedicaments[index][field] = value;
    setMedicaments(newMedicaments);
  };

  // Créer une ordonnance
  const handleCreatePrescription = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.patient_id) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }

    if (!formData.diagnostic) {
      toast.error('Le diagnostic est requis');
      return;
    }

    const validMedicaments = medicaments.filter(m => m.nom && m.posologie);
    if (validMedicaments.length === 0) {
      toast.error('Veuillez ajouter au moins un médicament valide');
      return;
    }

    try {
      const response = await prescriptionService.createPrescription({
        ...formData,
        medicaments: validMedicaments
      });

      if (response.success) {
        toast.success('Ordonnance créée avec succès');
        setShowCreateModal(false);
        resetForm();
        fetchPrescriptions();
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création');
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      patient_id: '',
      consultation_id: '',
      diagnostic: '',
      instructions: '',
      duree_traitement: ''
    });
    setMedicaments([{ nom: '', dosage: '', forme: 'comprimé', posologie: '', duree: '' }]);
  };

  // Voir les détails
  const handleViewDetails = async (id) => {
    try {
      const response = await prescriptionService.getPrescriptionById(id);
      if (response.success) {
        setSelectedPrescription(response.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des détails');
    }
  };

  // Télécharger le PDF
  const handleDownloadPDF = async (id) => {
    try {
      await prescriptionService.downloadPDF(id);
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      toast.error(error.message || 'Erreur lors du téléchargement');
    }
  };

  // Créer une facture
  const handleCreateInvoice = async () => {
    if (!invoiceAmount || invoiceAmount <= 0) {
      toast.error('Montant invalide');
      return;
    }

    try {
      const response = await prescriptionService.createInvoice(
        selectedPrescription.id,
        parseFloat(invoiceAmount)
      );

      if (response.success) {
        toast.success('Facture créée avec succès');
        setShowInvoiceModal(false);
        setInvoiceAmount('');
        fetchPrescriptions();
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création de la facture');
    }
  };

  // Supprimer une ordonnance
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette ordonnance ?')) {
      return;
    }

    try {
      const response = await prescriptionService.deletePrescription(id);
      if (response.success) {
        toast.success('Ordonnance supprimée');
        fetchPrescriptions();
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Badge de statut
  const getStatusBadge = (statut) => {
    const config = {
      en_attente: { label: 'En attente', class: 'status-waiting', icon: <MdWarning /> },
      payee: { label: 'Payée', class: 'status-paid', icon: <MdCheckCircle /> },
      annulee: { label: 'Annulée', class: 'status-cancelled', icon: <MdCancel /> }
    };

    const { label, class: className, icon } = config[statut] || config.en_attente;

    return (
      <span className={`status-badge ${className}`}>
        {icon}
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="prescriptions-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prescriptions-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Mes Ordonnances</h1>
          <p>Gérez vos prescriptions médicales</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={handleRefresh} disabled={refreshing}>
            <MdRefresh className={refreshing ? 'spinning' : ''} />
            Actualiser
          </button>
          <button className="btn-create" onClick={() => setShowCreateModal(true)}>
            <MdAdd />
            Nouvelle Ordonnance
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-item">
          <MdPerson />
          <select
            value={filters.patient_id}
            onChange={(e) => setFilters({ ...filters, patient_id: e.target.value })}
            className="filter-select"
          >
            <option value="">Tous les patients</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.prenom} {patient.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <MdFilterList />
          <select
            value={filters.statut}
            onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
            className="filter-select"
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="payee">Payée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>

        <div className="filter-item">
          <MdCalendarToday />
          <input
            type="date"
            value={filters.date_debut}
            onChange={(e) => setFilters({ ...filters, date_debut: e.target.value })}
            className="filter-input"
            placeholder="Date début"
          />
        </div>

        <div className="filter-item">
          <MdCalendarToday />
          <input
            type="date"
            value={filters.date_fin}
            onChange={(e) => setFilters({ ...filters, date_fin: e.target.value })}
            className="filter-input"
            placeholder="Date fin"
          />
        </div>
      </div>

      {/* Liste des ordonnances */}
      <div className="prescriptions-grid">
        {prescriptions.length > 0 ? (
          prescriptions.map((prescription) => (
            <div key={prescription.id} className="prescription-card">
              <div className="card-header">
                <div className="prescription-number">
                  <MdMedication />
                  <span>{prescription.numero_ordonnance}</span>
                </div>
                {getStatusBadge(prescription.statut)}
              </div>

              <div className="card-body">
                <div className="patient-info">
                  <MdPerson />
                  <span>{prescription.patient_prenom} {prescription.patient_nom}</span>
                </div>

                <div className="diagnostic">
                  <strong>Diagnostic:</strong>
                  <p>{prescription.diagnostic}</p>
                </div>

                <div className="medicaments-count">
                  <MdLocalHospital />
                  <span>{prescription.medicaments.length} médicament(s)</span>
                </div>

                <div className="date">
                  <MdCalendarToday />
                  <span>{formatDate(prescription.created_at || prescription.date_creation)}</span>
                </div>
              </div>

              <div className="card-footer">
                <button
                  className="btn-details"
                  onClick={() => handleViewDetails(prescription.id)}
                >
                  <MdVisibility />
                  Détails
                </button>

                <button
                  className="btn-pdf"
                  onClick={() => handleDownloadPDF(prescription.id)}
                >
                  <MdDownload />
                  PDF
                </button>

                {!prescription.invoice_id && prescription.statut === 'en_attente' && (
                  <button
                    className="btn-invoice"
                    onClick={() => {
                      setSelectedPrescription(prescription);
                      setShowInvoiceModal(true);
                    }}
                  >
                    <MdPayment />
                    Facture
                  </button>
                )}

                {prescription.statut === 'en_attente' && (
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(prescription.id)}
                  >
                    <MdDelete />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <MdMedication />
            <p>Aucune ordonnance trouvée</p>
          </div>
        )}
      </div>

      {/* Modal Création */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nouvelle Ordonnance</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleCreatePrescription}>
              <div className="modal-body">
                {/* Patient */}
                <div className="form-group">
                  <label>Patient *</label>
                  <select
                    value={formData.patient_id}
                    onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.prenom} {patient.nom} - {patient.numero_dossier}
                      </option>
                    ))}
                  </select>
                  {/* Debug: Afficher le nombre de patients */}
                  {patients.length === 0 && (
                    <small style={{color: 'orange', display: 'block', marginTop: '5px'}}>
                      ⚠️ Aucun patient trouvé. Assurez-vous d'avoir des patients dans votre liste.
                    </small>
                  )}
                </div>

                {/* Diagnostic */}
                <div className="form-group">
                  <label>Diagnostic *</label>
                  <textarea
                    value={formData.diagnostic}
                    onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
                    rows="3"
                    required
                  />
                </div>

                {/* Médicaments */}
                <div className="form-group">
                  <label>Médicaments *</label>
                  {medicaments.map((med, index) => (
                    <div key={index} className="medicament-item">
                      <div className="medicament-header">
                        <span>Médicament {index + 1}</span>
                        {medicaments.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-med"
                            onClick={() => handleRemoveMedicament(index)}
                          >
                            <MdDelete />
                          </button>
                        )}
                      </div>

                      <div className="medicament-fields">
                        <input
                          type="text"
                          placeholder="Nom du médicament *"
                          value={med.nom}
                          onChange={(e) => handleMedicamentChange(index, 'nom', e.target.value)}
                          required
                        />

                        <input
                          type="text"
                          placeholder="Dosage (ex: 500mg)"
                          value={med.dosage}
                          onChange={(e) => handleMedicamentChange(index, 'dosage', e.target.value)}
                        />

                        <select
                          value={med.forme}
                          onChange={(e) => handleMedicamentChange(index, 'forme', e.target.value)}
                        >
                          <option value="comprimé">Comprimé</option>
                          <option value="gélule">Gélule</option>
                          <option value="sirop">Sirop</option>
                          <option value="solution">Solution</option>
                          <option value="crème">Crème</option>
                          <option value="pommade">Pommade</option>
                          <option value="suppositoire">Suppositoire</option>
                          <option value="injectable">Injectable</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Posologie (ex: 1 comprimé 3x/jour) *"
                          value={med.posologie}
                          onChange={(e) => handleMedicamentChange(index, 'posologie', e.target.value)}
                          required
                        />

                        <input
                          type="text"
                          placeholder="Durée (ex: 7 jours)"
                          value={med.duree}
                          onChange={(e) => handleMedicamentChange(index, 'duree', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="btn-add-med"
                    onClick={handleAddMedicament}
                  >
                    <MdAdd />
                    Ajouter un médicament
                  </button>
                </div>

                {/* Instructions */}
                <div className="form-group">
                  <label>Instructions et recommandations</label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows="3"
                    placeholder="Recommandations pour le patient..."
                  />
                </div>

                {/* Durée du traitement */}
                <div className="form-group">
                  <label>Durée totale du traitement</label>
                  <input
                    type="text"
                    value={formData.duree_traitement}
                    onChange={(e) => setFormData({ ...formData, duree_traitement: e.target.value })}
                    placeholder="ex: 7 jours, 2 semaines, 1 mois"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  Créer l'Ordonnance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détails - Reste identique... */}
      {/* Modal Facture - Reste identique... */}
    </div>
  );
};

export default Prescriptions;