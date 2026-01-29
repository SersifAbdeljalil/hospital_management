import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import prescriptionService from '../services/Prescriptionservice';
import {
  MdArrowBack,
  MdCreditCard,
  MdLock,
  MdCheckCircle,
  MdMedication,
  MdPerson,
  MdCalendarToday,
  MdAttachMoney,
  MdSecurity
} from 'react-icons/md';
import { FaCcVisa, FaCcMastercard, FaCcAmex } from 'react-icons/fa';
import './PrescriptionPayment.css';

const PrescriptionPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('card'); // card, mobile, cash
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const [acceptTerms, setAcceptTerms] = useState(false);

  const PRESCRIPTION_PRICE = 150; // Prix fixe en MAD

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    setLoading(true);
    try {
      const response = await prescriptionService.getPrescriptionById(id);
      if (response.success) {
        setPrescription(response.data);

        // Rediriger si déjà payée
        if (response.data.paiement_statut === 'payee') {
          toast.info('Cette ordonnance a déjà été payée');
          navigate('/my-prescriptions');
        }
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'ordonnance');
      navigate('/my-prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      // Format: XXXX XXXX XXXX XXXX
      formattedValue = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim()
        .substring(0, 19);
    } else if (name === 'expiryDate') {
      // Format: MM/YY
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .substring(0, 5);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 3);
    } else if (name === 'cardName') {
      formattedValue = value.toUpperCase();
    }

    setCardData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const validatePayment = () => {
    if (!acceptTerms) {
      toast.error('Veuillez accepter les conditions');
      return false;
    }

    if (paymentMethod === 'card') {
      if (!cardData.cardNumber || cardData.cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('Numéro de carte invalide');
        return false;
      }

      if (!cardData.cardName) {
        toast.error('Nom du titulaire requis');
        return false;
      }

      if (!cardData.expiryDate || !cardData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
        toast.error('Date d\'expiration invalide (MM/YY)');
        return false;
      }

      if (!cardData.cvv || cardData.cvv.length !== 3) {
        toast.error('CVV invalide');
        return false;
      }
    }

    return true;
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!validatePayment()) return;

    setProcessing(true);

    try {
      // Simuler le traitement de paiement
      await new Promise(resolve => setTimeout(resolve, 2000));

      const paymentData = {
        montant: PRESCRIPTION_PRICE,
        methode_paiement: paymentMethod === 'card' ? 'Carte bancaire' : 
                         paymentMethod === 'mobile' ? 'Paiement mobile' : 'Espèces',
        prescription_id: id
      };

      const response = await prescriptionService.payPrescription(id, paymentData);

      if (response.success) {
        toast.success('🎉 Paiement effectué avec succès !');
        
        // Rediriger vers la page de téléchargement
        setTimeout(() => {
          navigate(`/my-prescriptions`);
        }, 1500);
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors du paiement');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-loading">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="payment-page">
        <div className="payment-error">
          <p>Ordonnance introuvable</p>
          <button onClick={() => navigate('/my-prescriptions')} className="btn-back">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        
        {/* Header */}
        <div className="payment-header">
          <button className="btn-back-header" onClick={() => navigate('/my-prescriptions')}>
            <MdArrowBack />
            Retour
          </button>
          <h1>Paiement de l'Ordonnance</h1>
          <div className="secure-badge">
            <MdLock />
            Paiement sécurisé
          </div>
        </div>

        <div className="payment-content">
          
          {/* Résumé de l'ordonnance */}
          <div className="payment-summary">
            <div className="summary-header">
              <MdMedication className="summary-icon" />
              <h2>Résumé de l'ordonnance</h2>
            </div>

            <div className="summary-body">
              <div className="summary-item">
                <span className="summary-label">N° Ordonnance:</span>
                <span className="summary-value">{prescription.numero_ordonnance}</span>
              </div>

              <div className="summary-item">
                <span className="summary-label">
                  <MdPerson /> Médecin:
                </span>
                <span className="summary-value">
                  Dr. {prescription.medecin_nom} {prescription.medecin_prenom}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">
                  <MdCalendarToday /> Date de prescription:
                </span>
                <span className="summary-value">
                  {formatDate(prescription.date_creation || prescription.created_at)}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Diagnostic:</span>
                <span className="summary-value">{prescription.diagnostic}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span className="total-label">Montant à payer:</span>
                <span className="total-value">{PRESCRIPTION_PRICE} MAD</span>
              </div>

              <div className="summary-note">
                <MdCheckCircle />
                <p>Après paiement, vous pourrez télécharger votre ordonnance signée</p>
              </div>
            </div>
          </div>

          {/* Formulaire de paiement */}
          <div className="payment-form-container">
            <div className="payment-methods">
              <h3>Mode de paiement</h3>
              
              <div className="method-options">
                <button
                  className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <MdCreditCard />
                  <span>Carte bancaire</span>
                </button>

                <button
                  className={`method-btn ${paymentMethod === 'mobile' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('mobile')}
                >
                  <MdAttachMoney />
                  <span>Mobile Money</span>
                </button>

                <button
                  className={`method-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <MdAttachMoney />
                  <span>Espèces</span>
                </button>
              </div>
            </div>

            <form onSubmit={handlePayment} className="payment-form">
              
              {paymentMethod === 'card' && (
                <>
                  <div className="card-logos">
                    <FaCcVisa />
                    <FaCcMastercard />
                    <FaCcAmex />
                  </div>

                  <div className="form-group">
                    <label>Numéro de carte *</label>
                    <div className="input-wrapper">
                      <MdCreditCard className="input-icon" />
                      <input
                        type="text"
                        name="cardNumber"
                        value={cardData.cardNumber}
                        onChange={handleCardInputChange}
                        placeholder="1234 5678 9012 3456"
                        className="form-input"
                        maxLength="19"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Nom du titulaire *</label>
                    <div className="input-wrapper">
                      <MdPerson className="input-icon" />
                      <input
                        type="text"
                        name="cardName"
                        value={cardData.cardName}
                        onChange={handleCardInputChange}
                        placeholder="PRENOM NOM"
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date d'expiration *</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={cardData.expiryDate}
                        onChange={handleCardInputChange}
                        placeholder="MM/YY"
                        className="form-input"
                        maxLength="5"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>CVV *</label>
                      <div className="input-wrapper">
                        <MdLock className="input-icon" />
                        <input
                          type="text"
                          name="cvv"
                          value={cardData.cvv}
                          onChange={handleCardInputChange}
                          placeholder="123"
                          className="form-input"
                          maxLength="3"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {paymentMethod === 'mobile' && (
                <div className="mobile-payment-info">
                  <div className="info-box">
                    <MdAttachMoney className="info-icon" />
                    <div>
                      <h4>Paiement mobile</h4>
                      <p>Vous recevrez un SMS avec les instructions de paiement</p>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="cash-payment-info">
                  <div className="info-box warning">
                    <MdSecurity className="info-icon" />
                    <div>
                      <h4>Paiement en espèces</h4>
                      <p>Veuillez vous présenter à la réception avec le montant exact de {PRESCRIPTION_PRICE} MAD</p>
                      <p className="small">Horaires: Lun-Ven 8h-18h, Sam 9h-13h</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <label htmlFor="terms">
                  J'accepte les <a href="/terms" target="_blank">conditions générales</a> et 
                  la <a href="/privacy" target="_blank">politique de confidentialité</a>
                </label>
              </div>

              <button
                type="submit"
                className="submit-payment-btn"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <span className="spinner"></span>
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <MdCheckCircle />
                    Payer {PRESCRIPTION_PRICE} MAD
                  </>
                )}
              </button>

              <div className="security-note">
                <MdSecurity />
                <p>Vos informations sont sécurisées et chiffrées</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPayment;