import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import prescriptionService from '../services/Prescriptionservice';
import useAuth from '../hooks/useAuth';
import {
  MdClose,
  MdDownload,
  MdVisibility,
  MdMedication,
  MdPerson,
  MdCalendarToday,
  MdLocalHospital,
  MdCheckCircle,
  MdWarning,
  MdCancel,
  MdPayment,
  MdRefresh
} from 'react-icons/md';
import './MyPrescriptions.css';

const MyPrescriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchMyPrescriptions();
  }, []);

  const fetchMyPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await prescriptionService.getMyPrescriptions();
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMyPrescriptions();
    setRefreshing(false);
    toast.success('Liste actualisée');
  };

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

  const handleDownloadPDF = async (id, statut) => {
    if (statut !== 'payee') {
      toast.warning('⚠️ Paiement requis pour télécharger cette ordonnance');
      return;
    }

    try {
      await prescriptionService.downloadPDF(id);
      toast.success('✅ PDF téléchargé avec succès');
    } catch (error) {
      toast.error(error.message || 'Erreur lors du téléchargement');
    }
  };

  const handlePayment = (prescriptionId) => {
    navigate(`/prescriptions/${prescriptionId}/payment`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (statut) => {
    const config = {
      en_attente: { label: 'Paiement requis', class: 'status-waiting', icon: <MdWarning /> },
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
      <div className="my-prescriptions-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-prescriptions-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Mes Ordonnances</h1>
          <p>Consultez et téléchargez vos prescriptions médicales</p>
        </div>
        <button className="btn-refresh" onClick={handleRefresh} disabled={refreshing}>
          <MdRefresh className={refreshing ? 'spinning' : ''} />
          Actualiser
        </button>
      </div>

      {/* Grille des ordonnances */}
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
                <div className="doctor-info">
                  <MdPerson />
                  <div>
                    <strong>Dr. {prescription.medecin_nom} {prescription.medecin_prenom}</strong>
                    <span className="specialty">{prescription.medecin_specialite}</span>
                  </div>
                </div>

                <div className="diagnostic">
                  <strong>Diagnostic:</strong>
                  <p>{prescription.diagnostic}</p>
                </div>

                <div className="medicaments-count">
                  <MdLocalHospital />
                  <span>{prescription.medicaments.length} médicament(s) prescrit(s)</span>
                </div>

                <div className="date">
                  <MdCalendarToday />
                  <span>{formatDate(prescription.date_creation)}</span>
                </div>

                {prescription.statut === 'en_attente' && prescription.montant_total && (
                  <div className="payment-info">
                    <MdPayment />
                    <span>Montant à payer: {prescription.montant_total} MAD</span>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button
                  className="btn-details"
                  onClick={() => handleViewDetails(prescription.id)}
                >
                  <MdVisibility />
                  Voir Détails
                </button>

                {prescription.statut === 'payee' ? (
                  <button
                    className="btn-download"
                    onClick={() => handleDownloadPDF(prescription.id, prescription.statut)}
                  >
                    <MdDownload />
                    Télécharger PDF
                  </button>
                ) : (
                  <button
                    className="btn-payment"
                    onClick={() => handlePayment(prescription.id)}
                  >
                    <MdPayment />
                    Payer 150 MAD
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <MdMedication />
            <p>Aucune ordonnance disponible</p>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showDetailsModal && selectedPrescription && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails de l'Ordonnance</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                <MdClose />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Informations Générales</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">N° Ordonnance:</span>
                    <span className="value">{selectedPrescription.numero_ordonnance}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Statut:</span>
                    <span className="value">{getStatusBadge(selectedPrescription.statut)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Date de prescription:</span>
                    <span className="value">{formatDate(selectedPrescription.date_creation)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Médecin Prescripteur</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Nom:</span>
                    <span className="value">
                      Dr. {selectedPrescription.medecin_nom} {selectedPrescription.medecin_prenom}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Spécialité:</span>
                    <span className="value">{selectedPrescription.medecin_specialite}</span>
                  </div>
                  {selectedPrescription.medecin_telephone && (
                    <div className="detail-item">
                      <span className="label">Téléphone:</span>
                      <span className="value">{selectedPrescription.medecin_telephone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Diagnostic</h3>
                <p className="detail-text">{selectedPrescription.diagnostic}</p>
              </div>

              <div className="detail-section">
                <h3>Médicaments Prescrits</h3>
                {selectedPrescription.medicaments.map((med, index) => (
                  <div key={index} className="medicament-detail">
                    <div className="med-number">{index + 1}</div>
                    <div className="med-info">
                      <h4>{med.nom}</h4>
                      <p><strong>Dosage:</strong> {med.dosage || 'Non spécifié'}</p>
                      <p><strong>Forme:</strong> {med.forme}</p>
                      <p><strong>Posologie:</strong> {med.posologie}</p>
                      {med.duree && <p><strong>Durée:</strong> {med.duree}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPrescription.instructions && (
                <div className="detail-section">
                  <h3>Instructions et Recommandations</h3>
                  <p className="detail-text">{selectedPrescription.instructions}</p>
                </div>
              )}

              {selectedPrescription.duree_traitement && (
                <div className="detail-section">
                  <h3>Durée Totale du Traitement</h3>
                  <p className="detail-text highlight">{selectedPrescription.duree_traitement}</p>
                </div>
              )}

              {selectedPrescription.statut === 'en_attente' && (
                <div className="detail-section payment-section">
                  <h3><MdPayment /> Information de Paiement</h3>
                  <div className="payment-details">
                    <p><strong>Montant à payer:</strong> 150 MAD</p>
                    <p className="payment-note">
                      Veuillez effectuer le paiement pour pouvoir télécharger cette ordonnance.
                    </p>
                    <button
                      className="btn-payment-modal"
                      onClick={() => {
                        setShowDetailsModal(false);
                        handlePayment(selectedPrescription.id);
                      }}
                    >
                      <MdPayment />
                      Procéder au paiement
                    </button>
                  </div>
                </div>
              )}

              {selectedPrescription.statut === 'payee' && (
                <div className="detail-section success-section">
                  <MdCheckCircle />
                  <p>Paiement effectué. Vous pouvez télécharger l'ordonnance.</p>
                  <button
                    className="btn-download-full"
                    onClick={() => handleDownloadPDF(selectedPrescription.id, selectedPrescription.statut)}
                  >
                    <MdDownload />
                    Télécharger l'Ordonnance PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPrescriptions;