import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MdEmail, MdLock, MdPerson, MdPhone, MdHome, MdCalendarToday, MdWc, MdVisibility, MdVisibilityOff, MdMedicalServices } from 'react-icons/md';
import './Register.css';
import authService from '../services/authService';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    telephone: '',
    adresse: '',
    date_naissance: '',
    sexe: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Nom
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    // Prénom
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    // Email
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // Téléphone
    if (formData.telephone && !/^[0-9]{10}$/.test(formData.telephone.replace(/\s/g, ''))) {
      newErrors.telephone = 'Numéro de téléphone invalide (10 chiffres)';
    }

    // Date de naissance
    if (!formData.date_naissance) {
      newErrors.date_naissance = 'La date de naissance est requise';
    } else {
      const birthDate = new Date(formData.date_naissance);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        newErrors.date_naissance = 'Date de naissance invalide';
      }
    }

    // Sexe
    if (!formData.sexe) {
      newErrors.sexe = 'Le sexe est requis';
    }

    // Mot de passe
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    // Confirmation mot de passe
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
      const userData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: 'patient',
        telephone: formData.telephone || null,
        adresse: formData.adresse || null,
        date_naissance: formData.date_naissance,
        sexe: formData.sexe
      };

      const result = await authService.register(userData);

      if (result.success) {
        toast.success('Inscription réussie ! Bienvenue chez MediCare');
        navigate('/patient/dashboard');
      } else {
        toast.error(result.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      toast.error(error.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        
        {/* ========== CÔTÉ GAUCHE - BRANDING ========== */}
        <div className="register-left">
          <div className="register-brand">
            <div className="brand-icon">
              <MdMedicalServices />
            </div>
            <h1>MediCare</h1>
            <p>Hospital Management System</p>
          </div>

          <div className="register-illustration">
            <div className="illustration-circle circle-1"></div>
            <div className="illustration-circle circle-2"></div>
            <div className="illustration-circle circle-3"></div>
          </div>

          <div className="register-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <p>Dossier médical sécurisé</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <p>Prise de rendez-vous en ligne</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <p>Suivi de vos consultations</p>
            </div>
          </div>
        </div>

        {/* ========== CÔTÉ DROIT - FORMULAIRE ========== */}
        <div className="register-right">
          <div className="register-form-container">
            
            {/* Header */}
            <div className="register-header">
              <h2>Créer un compte patient</h2>
              <p>Remplissez le formulaire ci-dessous</p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="register-form">
              
              {/* Nom & Prénom */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nom" className="form-label">
                    Nom <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <MdPerson className="input-icon" />
                    <input
                      type="text"
                      id="nom"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      placeholder="Votre nom"
                      className={`form-input ${errors.nom ? 'input-error' : ''}`}
                      disabled={loading}
                    />
                  </div>
                  {errors.nom && (
                    <span className="error-message">{errors.nom}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="prenom" className="form-label">
                    Prénom <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <MdPerson className="input-icon" />
                    <input
                      type="text"
                      id="prenom"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      placeholder="Votre prénom"
                      className={`form-input ${errors.prenom ? 'input-error' : ''}`}
                      disabled={loading}
                    />
                  </div>
                  {errors.prenom && (
                    <span className="error-message">{errors.prenom}</span>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <MdEmail className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="exemple@email.com"
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <span className="error-message">{errors.email}</span>
                )}
              </div>

              {/* Téléphone */}
              <div className="form-group">
                <label htmlFor="telephone" className="form-label">
                  Téléphone
                </label>
                <div className="input-wrapper">
                  <MdPhone className="input-icon" />
                  <input
                    type="tel"
                    id="telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    placeholder="0612345678"
                    className={`form-input ${errors.telephone ? 'input-error' : ''}`}
                    disabled={loading}
                  />
                </div>
                {errors.telephone && (
                  <span className="error-message">{errors.telephone}</span>
                )}
              </div>

              {/* Date de naissance & Sexe */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date_naissance" className="form-label">
                    Date de naissance <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <MdCalendarToday className="input-icon" />
                    <input
                      type="date"
                      id="date_naissance"
                      name="date_naissance"
                      value={formData.date_naissance}
                      onChange={handleChange}
                      className={`form-input ${errors.date_naissance ? 'input-error' : ''}`}
                      disabled={loading}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  {errors.date_naissance && (
                    <span className="error-message">{errors.date_naissance}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="sexe" className="form-label">
                    Sexe <span className="required">*</span>
                  </label>
                  <div className="input-wrapper">
                    <MdWc className="input-icon" />
                    <select
                      id="sexe"
                      name="sexe"
                      value={formData.sexe}
                      onChange={handleChange}
                      className={`form-input form-select ${errors.sexe ? 'input-error' : ''}`}
                      disabled={loading}
                    >
                      <option value="">Sélectionnez</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>
                  {errors.sexe && (
                    <span className="error-message">{errors.sexe}</span>
                  )}
                </div>
              </div>

              {/* Adresse */}
              <div className="form-group">
                <label htmlFor="adresse" className="form-label">
                  Adresse
                </label>
                <div className="input-wrapper">
                  <MdHome className="input-icon" />
                  <input
                    type="text"
                    id="adresse"
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleChange}
                    placeholder="Votre adresse complète"
                    className="form-input"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mot de passe <span className="required">*</span>
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
                    Création en cours...
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="register-footer">
              <p>
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="login-link">
                  Se connecter
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;