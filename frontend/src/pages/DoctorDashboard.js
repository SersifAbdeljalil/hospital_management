import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import dashboardService from '../services/dashboardService';
import useAuth from '../hooks/useAuth';
import {
  MdLocalHospital,
  MdCalendarToday,
  MdAttachMoney,
  MdTrendingUp,
  MdAccessTime,
  MdCheckCircle,
  MdCancel,
  MdSchedule,
  MdPerson,
  MdChevronRight,
  MdRefresh,
  MdDashboard,
  MdPeople,
  MdSettings,
  MdLogout,
  MdMenu,
  MdClose,
  MdMedication,
  MdEventNote,
  MdAssignment
} from 'react-icons/md';
import { 
  FaUserMd, 
  FaStethoscope,
  FaUserInjured,
  FaClipboardList
} from 'react-icons/fa';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getDoctorStats();
      console.log('Stats reçues:', response);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erreur fetchStats:', error);
      toast.error(error.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
    toast.success('Statistiques actualisées');
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
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Navigation items
  const getNavigationItems = () => {
    return [
      {
        section: 'Principal',
        items: [
          { path: '/doctor/dashboard', icon: <MdDashboard />, text: 'Dashboard' }
        ]
      },
      {
        section: 'Mon Activité',
        items: [
          { path: '/my-appointments', icon: <MdCalendarToday />, text: 'Mes RDV', badge: stats?.appointments?.today || 0 },
          { path: '/my-patients', icon: <MdLocalHospital />, text: 'Mes Patients' },
          { path: '/consultations', icon: <FaStethoscope />, text: 'Consultations' },
          { path: '/prescriptions', icon: <MdMedication />, text: 'Ordonnances' }
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
        <p>Chargement du dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-loading">
        <p>Impossible de charger les statistiques</p>
        <button onClick={fetchStats} className="refresh-btn">
          <MdRefresh />
          Réessayer
        </button>
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
              <FaUserMd />
            </div>
            <div className="logo-text">
              <h1 className="logo-title">MediCare</h1>
              <p className="logo-subtitle">Espace Médecin</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">{getUserInitials()}</div>
            <div className="user-details">
              <p className="user-name">
                Dr. {user?.prenom} {user?.nom}
              </p>
              <span className="user-role">{user?.specialite || 'Médecin'}</span>
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
        <div className="doctor-dashboard">
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <h1>Mon Tableau de Bord</h1>
              <p>Bienvenue, Dr. {user?.prenom} {user?.nom}</p>
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
                <h3>RDV Aujourd'hui</h3>
                <p className="stat-value">{stats?.appointments?.today || 0}</p>
                <span className="stat-label">
                  {stats?.appointments?.week || 0} cette semaine
                </span>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">
                <MdLocalHospital />
              </div>
              <div className="stat-content">
                <h3>Mes Patients</h3>
                <p className="stat-value">{stats?.patients?.total || 0}</p>
                <span className="stat-label">
                  Patients suivis
                </span>
              </div>
            </div>

            <div className="stat-card stat-info">
              <div className="stat-icon">
                <FaStethoscope />
              </div>
              <div className="stat-content">
                <h3>Consultations Ce Mois</h3>
                <p className="stat-value">{stats?.consultations?.month || 0}</p>
                <span className="stat-label">
                  {stats?.consultations?.today || 0} aujourd'hui
                </span>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">
                <MdMedication />
              </div>
              <div className="stat-content">
                <h3>Ordonnances</h3>
                <p className="stat-value">{stats?.prescriptions?.total || 0}</p>
                <span className="stat-label">
                  {stats?.prescriptions?.month || 0} ce mois
                </span>
              </div>
            </div>
          </div>

          {/* Charts and Tables Row */}
          <div className="dashboard-row">
            {/* Rendez-vous par statut */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Mes Rendez-vous par Statut</h2>
              </div>
              <div className="card-body">
                {stats?.appointments?.byStatus && stats.appointments.byStatus.length > 0 ? (
                  <div className="status-list">
                    {stats.appointments.byStatus.map((item, index) => {
                      const statusConfig = {
                        planifie: { label: 'Planifiés', color: '#2196F3', icon: <MdSchedule /> },
                        confirme: { label: 'Confirmés', color: '#388E3C', icon: <MdCheckCircle /> },
                        en_cours: { label: 'En cours', color: '#FF9800', icon: <MdAccessTime /> },
                        termine: { label: 'Terminés', color: '#4CAF50', icon: <MdCheckCircle /> },
                        annule: { label: 'Annulés', color: '#F44336', icon: <MdCancel /> },
                        non_presente: { label: 'Non présentés', color: '#9E9E9E', icon: <MdCancel /> }
                      };

                      const config = statusConfig[item.statut] || { label: item.statut, color: '#757575', icon: <MdSchedule /> };

                      return (
                        <div key={index} className="status-item">
                          <div className="status-icon" style={{ color: config.color }}>
                            {config.icon}
                          </div>
                          <div className="status-details">
                            <span className="status-name">{config.label}</span>
                            <span className="status-count">{item.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-message">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </div>

            {/* Consultations par type */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Types de Consultations</h2>
              </div>
              <div className="card-body">
                {stats?.consultations?.byType && stats.consultations.byType.length > 0 ? (
                  <div className="consultation-types">
                    {stats.consultations.byType.map((item, index) => {
                      const typeConfig = {
                        premiere_visite: { label: 'Première visite', color: '#2196F3' },
                        suivi: { label: 'Suivi', color: '#388E3C' },
                        urgence: { label: 'Urgence', color: '#F44336' },
                        controle: { label: 'Contrôle', color: '#FF9800' }
                      };

                      const config = typeConfig[item.type] || { label: item.type, color: '#757575' };
                      const total = stats.consultations.byType.reduce((sum, t) => sum + t.count, 0);
                      const percentage = total > 0 ? (item.count / total) * 100 : 0;

                      return (
                        <div key={index} className="consultation-type-item">
                          <div className="type-info">
                            <span className="type-name">{config.label}</span>
                            <span className="type-count">{item.count}</span>
                          </div>
                          <div className="type-bar">
                            <div 
                              className="type-bar-fill" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: config.color 
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-message">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Graphique d'évolution et Patients récents */}
          <div className="dashboard-row">
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Évolution des Consultations (7 derniers jours)</h2>
              </div>
              <div className="card-body">
                {stats?.consultations?.trend && stats.consultations.trend.length > 0 ? (
                  <div className="trend-chart">
                    {stats.consultations.trend.map((day, index) => {
                      const maxCount = Math.max(...stats.consultations.trend.map(d => d.count), 1);
                      const height = (day.count / maxCount) * 100;

                      return (
                        <div key={index} className="chart-bar-container">
                          <div className="chart-bar">
                            <div 
                              className="chart-bar-fill" 
                              style={{ height: `${height}%` }}
                              title={`${day.count} consultations`}
                            >
                              <span className="bar-value">{day.count}</span>
                            </div>
                          </div>
                          <span className="chart-label">
                            {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-message">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h2>Patients Récents</h2>
              </div>
              <div className="card-body">
                {stats?.patients?.recent && stats.patients.recent.length > 0 ? (
                  <div className="patients-list">
                    {stats.patients.recent.map((patient, index) => (
                      <div key={index} className="patient-item">
                        <div className="patient-avatar">
                          <FaUserInjured />
                        </div>
                        <div className="patient-info">
                          <span className="patient-name">
                            {patient.nom} {patient.prenom}
                          </span>
                          <span className="patient-meta">
                            N° {patient.numero_dossier}
                          </span>
                        </div>
                        <div className="patient-date">
                          {formatDate(patient.last_consultation)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-message">
                    <p>Aucun patient récent</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prochains RDV */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Mes Prochains Rendez-vous</h2>
              <button 
                className="view-all-btn"
                onClick={() => navigate('/my-appointments')}
              >
                Voir tout
                <MdChevronRight />
              </button>
            </div>
            <div className="card-body">
              <div className="appointments-list">
                {stats?.appointments?.upcoming && stats.appointments.upcoming.length > 0 ? (
                  stats.appointments.upcoming.map((apt) => (
                    <div key={apt.id} className="appointment-item">
                      <div className="appointment-time">
                        <MdCalendarToday />
                        <span>{formatDate(apt.date_heure)}</span>
                      </div>
                      <div className="appointment-details">
                        <div className="appointment-patient">
                          <MdPerson />
                          <span>{apt.patient_nom} {apt.patient_prenom}</span>
                        </div>
                        <div className="appointment-motif">
                          {apt.motif || 'Consultation générale'}
                        </div>
                      </div>
                      <span className={`appointment-status status-${apt.statut}`}>
                        {apt.statut}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-message">
                    <MdCalendarToday />
                    <p>Aucun rendez-vous à venir</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorDashboard;