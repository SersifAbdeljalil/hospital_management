import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import { MdEmail, MdLock, MdMedicalServices, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoutes = {
        admin: '/admin/dashboard',
        medecin: '/doctor/dashboard',
        infirmier: '/nurse/dashboard',
        receptionniste: '/receptionist/dashboard',
        patient: '/patient/dashboard'
      };

      const targetRoute = dashboardRoutes[user.role];
      if (targetRoute) {
        navigate(targetRoute, { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        toast.success('Connexion réussie !');
      } else {
        toast.error(result.message || 'Email ou mot de passe incorrect');
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        
        {/* ========== CÔTÉ GAUCHE - BRANDING ========== */}
        <div className="login-left">
          <div className="login-brand">
            <div className="brand-icon">
              <MdMedicalServices />
            </div>
            <h1>MediCare</h1>
            <p>Hospital Management System</p>
          </div>

          <div className="login-illustration">
            <div className="illustration-circle circle-1"></div>
            <div className="illustration-circle circle-2"></div>
            <div className="illustration-circle circle-3"></div>
          </div>

          <div className="login-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <p>Gestion complète des patients</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <p>Planification des rendez-vous</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <p>Dossiers médicaux électroniques</p>
            </div>
          </div>
        </div>

        {/* ========== CÔTÉ DROIT - FORMULAIRE ========== */}
        <div className="login-right">
          <div className="login-form-container">
            
            {/* Header */}
            <div className="login-header">
              <h2>Bienvenue</h2>
              <p>Connectez-vous à votre compte</p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="login-form">
              
              {/* Email Input */}
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

              {/* Password Input */}
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

              {/* Options */}
              <div className="login-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Se souvenir de moi</span>
                </label>
                <Link to="/forgot-password" className="forgot-password">
                  Mot de passe oublié ?
                </Link>
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
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="login-footer">
              <p>
                Vous n'avez pas de compte ?{' '}
                <Link to="/register" className="register-link">
                  S'inscrire
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;