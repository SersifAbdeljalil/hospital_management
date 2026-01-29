import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdLock, MdMedicalServices, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import './ResetPassword.css';
import authService from '../services/authService';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const result = await authService.verifyResetToken(token);
      if (result.success) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        toast.error('Lien de réinitialisation invalide ou expiré');
      }
    } catch (error) {
      setTokenValid(false);
      toast.error('Lien de réinitialisation invalide ou expiré');
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await authService.resetPassword(token, formData.password);

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

  if (verifying) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-loading">
            <div className="spinner-large"></div>
            <p>Vérification du lien...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-error">
            <div className="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            
            <h2>Lien invalide</h2>
            <p>
              Ce lien de réinitialisation est invalide ou a expiré. 
              Les liens de réinitialisation sont valables 1 heure.
            </p>

            <div className="error-actions">
              <Link to="/forgot-password" className="request-new-btn">
                Demander un nouveau lien
              </Link>
              <Link to="/login" className="back-to-login">
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        
        {/* Brand */}
        <div className="reset-password-brand">
          <div className="brand-icon">
            <MdMedicalServices />
          </div>
          <h1>MediCare</h1>
        </div>

        {/* Form */}
        <div className="reset-password-content">
          <div className="reset-password-header">
            <h2>Nouveau mot de passe</h2>
            <p>Choisissez un nouveau mot de passe sécurisé pour votre compte.</p>
          </div>

          <form onSubmit={handleSubmit} className="reset-password-form">
            
            {/* Password */}
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
              <p className="password-hint">
                Le mot de passe doit contenir au moins 6 caractères
              </p>
            </div>

            {/* Confirm Password */}
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

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
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

          <div className="reset-password-footer">
            <Link to="/login" className="back-link">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;