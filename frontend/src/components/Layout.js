import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

// Import des icônes React Icons
import {
  HiMenuAlt2,
  HiBell,
  HiChevronDown,
  HiLogout,
} from 'react-icons/hi';

import {
  MdDashboard,
  MdPeople,
  MdLocalHospital,
  MdCalendarToday,
  MdMedicalServices,
  MdAttachMoney,
  MdDescription,
  MdSettings,
  MdPersonAdd,
  MdAdd,
  MdPerson,
  MdAssignment,
  MdCheckCircle,
} from 'react-icons/md';

import {
  FaStethoscope,
  FaPills,
  FaUserMd,
  FaUserNurse,
  FaUserTie,
  FaUser,
} from 'react-icons/fa';

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
        { path: '/admin/dashboard', icon: <MdDashboard />, label: 'Dashboard', badge: null },
        { path: '/admin/users', icon: <MdPeople />, label: 'Utilisateurs', badge: null },
        { path: '/patients', icon: <MdLocalHospital />, label: 'Patients', badge: null },
        { path: '/appointments', icon: <MdCalendarToday />, label: 'Rendez-vous', badge: 5 },
        { path: '/consultations', icon: <FaStethoscope />, label: 'Consultations', badge: null },
        { path: '/billing', icon: <MdAttachMoney />, label: 'Facturation', badge: 3 },
        { path: '/logs', icon: <MdDescription />, label: 'Logs', badge: null },
        { path: '/settings', icon: <MdSettings />, label: 'Paramètres', badge: null },
      ],
      medecin: [
        { path: '/doctor/dashboard', icon: <MdDashboard />, label: 'Dashboard', badge: null },
        { path: '/patients', icon: <MdLocalHospital />, label: 'Mes Patients', badge: null },
        { path: '/appointments', icon: <MdCalendarToday />, label: 'Agenda', badge: 8 },
        { path: '/consultations', icon: <FaStethoscope />, label: 'Consultations', badge: null },
        { path: '/consultations/new', icon: <MdAdd />, label: 'Nouvelle Consultation', badge: null },
        { path: '/profile', icon: <MdPerson />, label: 'Mon Profil', badge: null },
      ],
      infirmier: [
        { path: '/nurse/dashboard', icon: <MdDashboard />, label: 'Dashboard', badge: null },
        { path: '/patients', icon: <MdLocalHospital />, label: 'Patients du jour', badge: null },
        { path: '/appointments', icon: <MdCalendarToday />, label: 'Rendez-vous', badge: 12 },
        { path: '/tasks', icon: <MdCheckCircle />, label: 'Tâches', badge: 4 },
        { path: '/profile', icon: <MdPerson />, label: 'Mon Profil', badge: null },
      ],
      receptionniste: [
        { path: '/receptionist/dashboard', icon: <MdDashboard />, label: 'Dashboard', badge: null },
        { path: '/patients', icon: <MdLocalHospital />, label: 'Patients', badge: null },
        { path: '/patients/new', icon: <MdPersonAdd />, label: 'Nouveau Patient', badge: null },
        { path: '/appointments', icon: <MdCalendarToday />, label: 'Rendez-vous', badge: 15 },
        { path: '/billing', icon: <MdAttachMoney />, label: 'Facturation', badge: 7 },
        { path: '/profile', icon: <MdPerson />, label: 'Mon Profil', badge: null },
      ],
      patient: [
        { path: '/patient/dashboard', icon: <MdDashboard />, label: 'Accueil', badge: null },
        { path: '/appointments', icon: <MdCalendarToday />, label: 'Mes Rendez-vous', badge: 2 },
        { path: '/consultations', icon: <FaStethoscope />, label: 'Mes Consultations', badge: null },
        { path: '/prescriptions', icon: <FaPills />, label: 'Ordonnances', badge: null },
        { path: '/billing', icon: <MdAttachMoney />, label: 'Factures', badge: 1 },
        { path: '/profile', icon: <MdPerson />, label: 'Mon Profil', badge: null },
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

  const getRoleIcon = () => {
    const icons = {
      admin: <MdSettings />,
      medecin: <FaUserMd />,
      infirmier: <FaUserNurse />,
      receptionniste: <FaUserTie />,
      patient: <FaUser />,
    };
    return icons[user?.role] || icons.patient;
  };

  return (
    <div className="layout">
      {/* HEADER */}
      <header className="layout-header">
        <div className="header-left">
          <button className="header-menu-toggle" onClick={toggleSidebar}>
            <HiMenuAlt2 />
          </button>

          <div className="header-logo">
            <div className="logo-icon">
              <MdMedicalServices />
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
            <HiBell />
            <span className="notification-badge">3</span>
          </button>

          {/* User Menu */}
          <div className="header-user">
            <div className="user-avatar" style={{ backgroundColor: getRoleColor() }}>
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.prenom} {user?.nom}</span>
              <span className="user-role">
                <span className="user-role-icon">{getRoleIcon()}</span>
                {getRoleLabel()}
              </span>
            </div>
            <button className="user-dropdown-btn">
              <HiChevronDown />
            </button>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="header-mobile-toggle" onClick={toggleMobileMenu}>
          <HiMenuAlt2 />
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
              title={item.label}
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
          <button className="nav-item nav-item-logout" onClick={handleLogout} title="Déconnexion">
            <span className="nav-icon"><HiLogout /></span>
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