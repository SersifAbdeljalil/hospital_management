import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdEmail, MdMedicalServices, MdArrowBack, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import './ForgotPassword.css';
import authService from '../services/authService';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // Étape 1: Demander le code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors({ email: 'L\'email est requis' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Email invalide' });
      return;
    }

    setLoading(true);

    try {
      const result = await authService.forgotPassword(email);

      if (result.success) {
        setStep(2);
        toast.success('Code de vérification envoyé à votre email !');
      } else {
        toast.error(result.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2: Vérifier le code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!code) {
      setErrors({ code: 'Le code est requis' });
      return;
    }

    if (code.length !== 6) {
      setErrors({ code: 'Le code doit contenir 6 caractères' });
      return;
    }

    setLoading(true);

    try {
      const result = await authService.verifyResetCode(email, code);

      if (result.success) {
        setStep(3);
        toast.success('Code vérifié avec succès !');
      } else {
        toast.error(result.message || 'Code invalide ou expiré');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  // Étape 3: Réinitialiser le mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const result = await authService.resetPassword(email, code, formData.password);

      if (result.success) {
        toast.success('Mot de passe réinitialisé avec succès !');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(result.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        
        {/* Brand */}
        <div className="forgot-password-brand">
          <div className="brand-icon">
            <MdMedicalServices />
          </div>
          <h1>SIGMAX MEDICAL</h1>
          <p className="brand-subtitle">Centre Médical Avancé</p>
        </div>

        {/* Content */}
        <div className="forgot-password-content">
          
          {/* Progress Bar */}
          <div className="progress-bar">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Email</div>
            </div>
            <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Code</div>
            </div>
            <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Mot de passe</div>
            </div>
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <>
              <div className="forgot-password-header">
                <h2>Mot de passe oublié ?</h2>
                <p>Entrez votre email pour recevoir un code de vérification</p>
              </div>

              <form onSubmit={handleRequestCode} className="forgot-password-form">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Adresse email
                  </label>
                  <div className="input-wrapper">
                    <MdEmail className="input-icon" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors({});
                      }}
                      placeholder="exemple@email.com"
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  {errors.email && (
                    <span className="error-message">{errors.email}</span>
                  )}
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Envoi en cours...
                    </>
                  ) : (
                    'Envoyer le code'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Verification Code */}
          {step === 2 && (
            <>
              <div className="forgot-password-header">
                <h2>Entrez le code de vérification</h2>
                <p>Un code à 6 caractères a été envoyé à <strong>{email}</strong></p>
              </div>

              <form onSubmit={handleVerifyCode} className="forgot-password-form">
                <div className="form-group">
                  <label htmlFor="code" className="form-label">
                    Code de vérification
                  </label>
                  <div className="input-wrapper">
                    <MdLock className="input-icon" />
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setErrors({});
                      }}
                      placeholder="XXXXXX"
                      className={`form-input code-input ${errors.code ? 'input-error' : ''}`}
                      disabled={loading}
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  {errors.code && (
                    <span className="error-message">{errors.code}</span>
                  )}
                  <p className="hint-text">Le code expire dans 15 minutes</p>
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Vérification...
                    </>
                  ) : (
                    'Vérifier le code'
                  )}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Changer l'email
                </button>
              </form>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <>
              <div className="forgot-password-header">
                <h2>Nouveau mot de passe</h2>
                <p>Choisissez un nouveau mot de passe sécurisé</p>
              </div>

              <form onSubmit={handleResetPassword} className="forgot-password-form">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Nouveau mot de passe <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <MdLock className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`form-input ${errors.password ? 'input-error' : ''}`}
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="error-message">{errors.password}</span>
                  )}
                  <p className="hint-text">Au moins 6 caractères</p>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmer le mot de passe <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <MdLock className="input-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="error-message">{errors.confirmPassword}</span>
                  )}
                </div>

                <button type="submit" className="submit-button" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Réinitialisation...
                    </>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="forgot-password-footer">
            <Link to="/login" className="back-link">
              <MdArrowBack />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;