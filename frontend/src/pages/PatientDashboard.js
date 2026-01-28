import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import dashboardService from '../services/dashboardService';
import appointmentService from '../services/appointmentService';
import useAuth from '../hooks/useAuth';
import {
  MdCalendarToday,
  MdLocalHospital,
  MdPerson,
  MdNotifications,
  MdChevronRight,
  MdCheckCircle,
  MdSchedule,
  MdCancel,
  MdRefresh,
  MdAdd,
  MdDashboard,
  MdLogout,
  MdMenu,
  MdClose,
  MdAccountCircle
} from 'react-icons/md';
import { FaStethoscope, FaFileMedical, FaPrescription, FaUserInjured } from 'react-icons/fa';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Récupérer les statistiques patient
      const statsResponse = await dashboardService.getPatientStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Récupérer les prochains rendez-vous
      const appointmentsResponse = await appointmentService.getMyAppointments({
        statut: 'planifie,confirme',
        limit: 5
      });
      if (appointmentsResponse.success) {
        setUpcomingAppointments(appointmentsResponse.data || []);
      }

    } catch (error) {
      console.error('Erreur fetchDashboardData:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Données actualisées');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Déconnexion réussie');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      planifie: { label: 'Planifié', color: '#2196F3', icon: <MdSchedule /> },
      confirme: { label: 'Confirmé', color: '#4CAF50', icon: <MdCheckCircle /> },
      termine: { label: 'Terminé', color: '#9E9E9E', icon: <MdCheckCircle /> },
      annule: { label: 'Annulé', color: '#F44336', icon: <MdCancel /> }
    };
    
    const config = statusConfig[statut] || statusConfig.planifie;
    
    return (
      <span className="status-badge" style={{ backgroundColor: config.color }}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Navigation items
  const getNavigationItems = () => {
    return [
      {
        section: 'Principal',
        items: [
          { path: '/patient/dashboard', icon: <MdDashboard />, text: 'Dashboard' }
        ]
      },
      {
        section: 'Mon Espace',
        items: [
          { path: '/my-appointments', icon: <MdCalendarToday />, text: 'Mes RDV', badge: upcomingAppointments.length },
          { path: '/my-consultations', icon: <FaStethoscope />, text: 'Consultations' },
          { path: '/my-prescriptions', icon: <FaPrescription />, text: 'Ordonnances' },
          { path: '/my-documents', icon: <FaFileMedical />, text: 'Documents' }
        ]
      },
      {
        section: 'Mon Compte',
        items: [
          { path: '/my-profile', icon: <MdAccountCircle />, text: 'Mon Profil' }
        ]
      }
    ];
  };

  const getUserInitials = () => {
    if (!user) return '?';
    const firstInitial = user.prenom?.charAt(0) || '';
    const lastInitial = user.nom?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Chargement de votre espace patient...</p>
      </div>
    );
  }

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarOpen ? <MdClose /> : <MdMenu />}
      </button>

      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <FaUserInjured />
            </div>
            <div className="logo-text">
              <h1 className="logo-title">MediCare</h1>
              <p className="logo-subtitle">Espace Patient</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">{getUserInitials()}</div>
            <div className="user-details">
              <p className="user-name">
                {user?.prenom} {user?.nom}
              </p>
              <span className="user-role">Patient</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {getNavigationItems().map((section, sectionIndex) => (
            <div key={sectionIndex} className="nav-section">
              <h3 className="nav-section-title">{section.section}</h3>
              <ul className="nav-list">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="nav-item">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => 
                        `nav-link ${isActive ? 'active' : ''}`
                      }
                      onClick={closeSidebar}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-text">{item.text}</span>
                      {item.badge > 0 && (
                        <span className="nav-badge">{item.badge}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <MdLogout />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <div className="patient-dashboard">
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <h1>Mon Espace Patient</h1>
              <p>Bienvenue, {user?.prenom} {user?.nom}</p>
            </div>
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <MdRefresh className={refreshing ? 'spinning' : ''} />
              Actualiser
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">
                <MdCalendarToday />
              </div>
              <div className="stat-content">
                <h3>Prochains RDV</h3>
                <p className="stat-value">{upcomingAppointments.length}</p>
                <span className="stat-label">Rendez-vous planifiés</span>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">
                <FaStethoscope />
              </div>
              <div className="stat-content">
                <h3>Consultations</h3>
                <p className="stat-value">{stats?.totalConsultations || 0}</p>
                <span className="stat-label">Historique complet</span>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">
                <FaPrescription />
              </div>
              <div className="stat-content">
                <h3>Ordonnances</h3>
                <p className="stat-value">{stats?.totalPrescriptions || 0}</p>
                <span className="stat-label">Ordonnances actives</span>
              </div>
            </div>

            <div className="stat-card stat-info">
              <div className="stat-icon">
                <FaFileMedical />
              </div>
              <div className="stat-content">
                <h3>Documents</h3>
                <p className="stat-value">{stats?.totalDocuments || 0}</p>
                <span className="stat-label">Documents médicaux</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="dashboard-row">
            {/* Prochains Rendez-vous */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>
                  <MdCalendarToday />
                  Mes Prochains Rendez-vous
                </h2>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/book-appointment')}
                >
                  <MdAdd />
                  Nouveau RDV
                </button>
              </div>
              <div className="card-body">
                {upcomingAppointments.length > 0 ? (
                  <div className="appointments-list">
                    {upcomingAppointments.map((apt) => (
                      <div key={apt.id} className="appointment-card">
                        <div className="appointment-date">
                          <div className="date-icon">
                            <MdCalendarToday />
                          </div>
                          <div className="date-info">
                            <span className="date">
                              {new Date(apt.date_heure).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </span>
                            <span className="time">
                              {new Date(apt.date_heure).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="appointment-details">
                          <div className="doctor-info">
                            <div className="doctor-avatar">
                              <MdPerson />
                            </div>
                            <div className="doctor-details">
                              <h4>Dr. {apt.medecin_nom} {apt.medecin_prenom}</h4>
                              <span className="specialty">{apt.specialite}</span>
                            </div>
                          </div>
                          
                          {apt.motif && (
                            <div className="appointment-reason">
                              <strong>Motif:</strong> {apt.motif}
                            </div>
                          )}
                          
                          <div className="appointment-footer">
                            {getStatusBadge(apt.statut)}
                            <button 
                              className="btn-link"
                              onClick={() => navigate(`/my-appointments/${apt.id}`)}
                            >
                              Détails <MdChevronRight />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <MdCalendarToday className="empty-icon" />
                    <p>Aucun rendez-vous à venir</p>
                    <button 
                      className="btn-primary"
                      onClick={() => navigate('/book-appointment')}
                    >
                      <MdAdd />
                      Prendre un rendez-vous
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Informations Patient */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>
                  <MdLocalHospital />
                  Mes Informations
                </h2>
              </div>
              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">N° Dossier</span>
                    <span className="info-value">{stats?.patientInfo?.numero_dossier || 'N/A'}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Groupe Sanguin</span>
                    <span className="info-value blood-type">
                      {stats?.patientInfo?.groupe_sanguin || 'Non renseigné'}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Téléphone</span>
                    <span className="info-value">{user?.telephone || 'Non renseigné'}</span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                </div>

                <button 
                  className="btn-outline full-width"
                  onClick={() => navigate('/my-profile')}
                >
                  Modifier mes informations
                </button>
              </div>
            </div>
          </div>

          {/* Dernières Consultations */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>
                <FaStethoscope />
                Mes Dernières Consultations
              </h2>
              <button 
                className="btn-link"
                onClick={() => navigate('/my-consultations')}
              >
                Voir tout <MdChevronRight />
              </button>
            </div>
            <div className="card-body">
              {recentConsultations.length > 0 ? (
                <div className="consultations-list">
                  {recentConsultations.map((consult) => (
                    <div key={consult.id} className="consultation-item">
                      <div className="consultation-date">
                        {formatDate(consult.date_consultation)}
                      </div>
                      <div className="consultation-doctor">
                        Dr. {consult.medecin_nom} {consult.medecin_prenom}
                      </div>
                      <div className="consultation-diagnosis">
                        {consult.diagnostic || 'Diagnostic non renseigné'}
                      </div>
                      <button 
                        className="btn-link-small"
                        onClick={() => navigate(`/my-consultations/${consult.id}`)}
                      >
                        Détails
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state-small">
                  <FaStethoscope className="empty-icon" />
                  <p>Aucune consultation récente</p>
                </div>
              )}
            </div>
          </div>

          {/* Actions Rapides */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Actions Rapides</h2>
            </div>
            <div className="card-body">
              <div className="quick-actions-grid">
                <button 
                  className="quick-action-btn"
                  onClick={() => navigate('/book-appointment')}
                >
                  <div className="action-icon">
                    <MdCalendarToday />
                  </div>
                  <span>Prendre RDV</span>
                </button>

                <button 
                  className="quick-action-btn"
                  onClick={() => navigate('/my-prescriptions')}
                >
                  <div className="action-icon">
                    <FaPrescription />
                  </div>
                  <span>Ordonnances</span>
                </button>

                <button 
                  className="quick-action-btn"
                  onClick={() => navigate('/my-documents')}
                >
                  <div className="action-icon">
                    <FaFileMedical />
                  </div>
                  <span>Documents</span>
                </button>

                <button 
                  className="quick-action-btn"
                  onClick={() => navigate('/my-profile')}
                >
                  <div className="action-icon">
                    <MdPerson />
                  </div>
                  <span>Mon Profil</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientDashboard;