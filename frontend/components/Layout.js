import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    // Logique de déconnexion
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Menu de navigation selon le rôle
  const getMenuItems = () => {
    const role = user?.role || 'patient';

    const menus = {
      admin: [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard', badge: null },
        { path: '/admin/users', icon: '👥', label: 'Utilisateurs', badge: null },
        { path: '/patients', icon: '🏥', label: 'Patients', badge: null },
        { path: '/appointments', icon: '📅', label: 'Rendez-vous', badge: 5 },
        { path: '/consultations', icon: '🩺', label: 'Consultations', badge: null },
        { path: '/billing', icon: '💰', label: 'Facturation', badge: 3 },
        { path: '/logs', icon: '📋', label: 'Logs', badge: null },
        { path: '/settings', icon: '⚙️', label: 'Paramètres', badge: null },
      ],
      medecin: [
        { path: '/doctor/dashboard', icon: '📊', label: 'Dashboard', badge: null },
        { path: '/patients', icon: '🏥', label: 'Mes Patients', badge: null },
        { path: '/appointments', icon: '📅', label: 'Agenda', badge: 8 },
        { path: '/consultations', icon: '🩺', label: 'Consultations', badge: null },
        { path: '/consultations/new', icon: '➕', label: 'Nouvelle Consultation', badge: null },
        { path: '/profile', icon: '👤', label: 'Mon Profil', badge: null },
      ],
      infirmier: [
        { path: '/nurse/dashboard', icon: '📊', label: 'Dashboard', badge: null },
        { path: '/patients', icon: '🏥', label: 'Patients du jour', badge: null },
        { path: '/appointments', icon: '📅', label: 'Rendez-vous', badge: 12 },
        { path: '/tasks', icon: '✅', label: 'Tâches', badge: 4 },
        { path: '/profile', icon: '👤', label: 'Mon Profil', badge: null },
      ],
      receptionniste: [
        { path: '/receptionist/dashboard', icon: '📊', label: 'Dashboard', badge: null },
        { path: '/patients', icon: '🏥', label: 'Patients', badge: null },
        { path: '/patients/new', icon: '➕', label: 'Nouveau Patient', badge: null },
        { path: '/appointments', icon: '📅', label: 'Rendez-vous', badge: 15 },
        { path: '/billing', icon: '💰', label: 'Facturation', badge: 7 },
        { path: '/profile', icon: '👤', label: 'Mon Profil', badge: null },
      ],
      patient: [
        { path: '/patient/dashboard', icon: '📊', label: 'Accueil', badge: null },
        { path: '/appointments', icon: '📅', label: 'Mes Rendez-vous', badge: 2 },
        { path: '/consultations', icon: '🩺', label: 'Mes Consultations', badge: null },
        { path: '/prescriptions', icon: '💊', label: 'Ordonnances', badge: null },
        { path: '/billing', icon: '💰', label: 'Factures', badge: 1 },
        { path: '/profile', icon: '👤', label: 'Mon Profil', badge: null },
      ],
    };

    return menus[role] || menus.patient;
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getRoleColor = () => {
    const colors = {
      admin: 'var(--role-admin)',
      medecin: 'var(--role-doctor)',
      infirmier: 'var(--role-nurse)',
      receptionniste: 'var(--role-receptionist)',
      patient: 'var(--role-patient)',
    };
    return colors[user?.role] || colors.patient;
  };

  const getRoleLabel = () => {
    const labels = {
      admin: 'Administrateur',
      medecin: 'Médecin',
      infirmier: 'Infirmier(ère)',
      receptionniste: 'Réceptionniste',
      patient: 'Patient',
    };
    return labels[user?.role] || 'Patient';
  };

  return (
    <div className="layout">
      {/* HEADER */}
      <header className="layout-header">
        <div className="header-left">
          <button className="header-menu-toggle" onClick={toggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="header-logo">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
              </svg>
            </div>
            <div className="logo-text">
              <h1>MediCare</h1>
              <p>Hospital Management</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          {/* Notifications */}
          <button className="header-icon-btn" title="Notifications">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="notification-badge">3</span>
          </button>

          {/* User Menu */}
          <div className="header-user">
            <div className="user-avatar" style={{ backgroundColor: getRoleColor() }}>
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.prenom} {user?.nom}</span>
              <span className="user-role">{getRoleLabel()}</span>
            </div>
            <button className="user-dropdown-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="header-mobile-toggle" onClick={toggleMobileMenu}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" strokeLinecap="round"/>
            <line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round"/>
            <line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </header>

      {/* SIDEBAR */}
      <aside className={`layout-sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'} ${mobileMenuOpen ? 'sidebar-mobile-open' : ''}`}>
        <nav className="sidebar-nav">
          {getMenuItems().map((item, index) => (
            <button
              key={index}
              className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item nav-item-logout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* MAIN CONTENT */}
      <main className={`layout-main ${sidebarOpen ? 'main-sidebar-open' : 'main-sidebar-collapsed'}`}>
        <div className="main-content">
          {children}
        </div>

        {/* FOOTER */}
        <footer className="layout-footer">
          <div className="footer-content">
            <p className="footer-copyright">
              &copy; {new Date().getFullYear()} MediCare Hospital Management System. Tous droits réservés.
            </p>
            <div className="footer-links">
              <a href="/terms">Conditions d'utilisation</a>
              <span className="footer-separator">•</span>
              <a href="/privacy">Confidentialité</a>
              <span className="footer-separator">•</span>
              <a href="/support">Support</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Layout;