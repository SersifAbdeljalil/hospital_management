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
  MdBloodtype,
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
  FaUserNurse, 
  FaUserTie, 
  FaUserInjured,
  FaUserShield,
  FaStethoscope
} from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
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
      const response = await dashboardService.getAdminStats();
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount || 0);
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

  const getRoleIcon = (role) => {
    const icons = {
      admin: <FaUserShield />,
      medecin: <FaUserMd />,
      infirmier: <FaUserNurse />,
      receptionniste: <FaUserTie />,
      patient: <FaUserInjured />
    };
    return icons[role] || <MdPerson />;
  };

  const getRoleConfig = (role) => {
    const configs = {
      admin: { label: 'Administrateurs', color: '#6A1B9A' },
      medecin: { label: 'Médecins', color: '#1565C0' },
      infirmier: { label: 'Infirmiers', color: '#388E3C' },
      receptionniste: { label: 'Réceptionnistes', color: '#F57C00' },
      patient: { label: 'Patients', color: '#00897B' }
    };
    return configs[role] || { label: role, color: '#757575' };
  };

  // Navigation items selon le rôle
  const getNavigationItems = () => {
    const roleBasedItems = {
      admin: [
        {
          section: 'Principal',
          items: [
            { path: '/admin/dashboard', icon: <MdDashboard />, text: 'Dashboard' }
          ]
        },
        {
          section: 'Gestion',
          items: [
            { path: '/patients', icon: <MdLocalHospital />, text: 'Patients' },
            { path: '/doctors', icon: <FaUserMd />, text: 'Médecins' },
            { path: '/appointments', icon: <MdCalendarToday />, text: 'Rendez-vous' },
            { path: '/consultations', icon: <FaStethoscope />, text: 'Consultations' }
          ]
        },
        {
          section: 'Finances',
          items: [
            { path: '/payments', icon: <MdAttachMoney />, text: 'Paiements' }
          ]
        },
        {
          section: 'Configuration',
          items: [
            { path: '/settings', icon: <MdSettings />, text: 'Paramètres' }
          ]
        }
      ],
      medecin: [
        {
          section: 'Principal',
          items: [
            { path: '/doctor/dashboard', icon: <MdDashboard />, text: 'Dashboard' }
          ]
        },
        {
          section: 'Mon Activité',
          items: [
            { path: '/my-appointments', icon: <MdCalendarToday />, text: 'Mes RDV', badge: 3 },
            { path: '/my-patients', icon: <MdLocalHospital />, text: 'Mes Patients' },
            { path: '/consultations', icon: <FaStethoscope />, text: 'Consultations' },
            { path: '/prescriptions', icon: <MdMedication />, text: 'Ordonnances' }
          ]
        }
      ],
      infirmier: [
        {
          section: 'Principal',
          items: [
            { path: '/nurse/dashboard', icon: <MdDashboard />, text: 'Dashboard' }
          ]
        },
        {
          section: 'Soins',
          items: [
            { path: '/patients', icon: <MdLocalHospital />, text: 'Patients' },
            { path: '/appointments', icon: <MdCalendarToday />, text: 'Rendez-vous' },
            { path: '/care-notes', icon: <MdEventNote />, text: 'Notes de soins' }
          ]
        }
      ],
      receptionniste: [
        {
          section: 'Principal',
          items: [
            { path: '/receptionist/dashboard', icon: <MdDashboard />, text: 'Dashboard' }
          ]
        },
        {
          section: 'Accueil',
          items: [
            { path: '/appointments', icon: <MdCalendarToday />, text: 'Rendez-vous', badge: 8 },
            { path: '/patients', icon: <MdLocalHospital />, text: 'Patients' },
            { path: '/waiting-room', icon: <MdPeople />, text: 'Salle d\'attente' }
          ]
        }
      ],
      patient: [
        {
          section: 'Principal',
          items: [
            { path: '/patient/dashboard', icon: <MdDashboard />, text: 'Dashboard' }
          ]
        },
        {
          section: 'Mon Espace',
          items: [
            { path: '/my-appointments', icon: <MdCalendarToday />, text: 'Mes RDV' },
            { path: '/my-consultations', icon: <FaStethoscope />, text: 'Mes Consultations' },
            { path: '/my-prescriptions', icon: <MdMedication />, text: 'Mes Ordonnances' }
          ]
        }
      ]
    };

    return roleBasedItems[user?.role] || roleBasedItems.patient;
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
              <MdLocalHospital />
            </div>
            <div className="logo-text">
              <h1 className="logo-title">MediCare</h1>
              <p className="logo-subtitle">Système de Gestion</p>
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
              <span className="user-role">{user?.role}</span>
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
                      {item.badge && (
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
        <div className="admin-dashboard">
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-content">
              <h1>Dashboard Administrateur</h1>
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
                <MdLocalHospital />
              </div>
              <div className="stat-content">
                <h3>Total Patients</h3>
                <p className="stat-value">{stats?.users?.totalPatients || 0}</p>
                <span className="stat-label">
                  <MdTrendingUp className="trend-up" />
                  +{stats?.patients?.newThisMonth || 0} ce mois
                </span>
              </div>
            </div>

            <div className="stat-card stat-warning">
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

            <div className="stat-card stat-info">
              <div className="stat-icon">
                <MdSchedule />
              </div>
              <div className="stat-content">
                <h3>RDV Ce Mois</h3>
                <p className="stat-value">{stats?.appointments?.month || 0}</p>
                <span className="stat-label">
                  {stats?.consultations?.month || 0} consultations
                </span>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">
                <MdAttachMoney />
              </div>
              <div className="stat-content">
                <h3>Revenus Ce Mois</h3>
                <p className="stat-value">{formatCurrency(stats?.revenue?.month || 0)}</p>
                <span className="stat-label">
                  <MdTrendingUp className="trend-up" />
                  Paiements reçus
                </span>
              </div>
            </div>
          </div>

          {/* Charts and Tables Row */}
          <div className="dashboard-row">
            {/* Utilisateurs par rôle */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Utilisateurs par Rôle</h2>
              </div>
              <div className="card-body">
                {stats?.users?.byRole && stats.users.byRole.length > 0 ? (
                  <div className="users-list">
                    {stats.users.byRole.map((item, index) => {
                      const config = getRoleConfig(item.role);
                      const totalCount = stats.users.byRole.reduce((sum, r) => sum + r.count, 0);
                      const percentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;

                      return (
                        <div key={index} className="user-role-item">
                          <div className="role-info">
                            <span className="role-icon" style={{ color: config.color }}>
                              {getRoleIcon(item.role)}
                            </span>
                            <div className="role-details">
                              <span className="role-name">{config.label}</span>
                              <span className="role-count">{item.count} utilisateur(s)</span>
                            </div>
                          </div>
                          <div className="role-bar">
                            <div 
                              className="role-bar-fill" 
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

            {/* Rendez-vous par statut */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Rendez-vous par Statut</h2>
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
          </div>

          {/* Graphique d'évolution et Top médecins */}
          <div className="dashboard-row">
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Évolution des Rendez-vous (7 derniers jours)</h2>
              </div>
              <div className="card-body">
                {stats?.appointments?.trend && stats.appointments.trend.length > 0 ? (
                  <div className="trend-chart">
                    {stats.appointments.trend.map((day, index) => {
                      const maxCount = Math.max(...stats.appointments.trend.map(d => d.count), 1);
                      const height = (day.count / maxCount) * 100;

                      return (
                        <div key={index} className="chart-bar-container">
                          <div className="chart-bar">
                            <div 
                              className="chart-bar-fill" 
                              style={{ height: `${height}%` }}
                              title={`${day.count} rendez-vous`}
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
                <h2>Top Médecins Ce Mois</h2>
              </div>
              <div className="card-body">
                {stats?.appointments?.byDoctor && stats.appointments.byDoctor.length > 0 ? (
                  <div className="doctors-list">
                    {stats.appointments.byDoctor.map((doctor, index) => (
                      <div key={index} className="doctor-item">
                        <div className="doctor-rank">#{index + 1}</div>
                        <div className="doctor-info">
                          <span className="doctor-name">
                            Dr. {doctor.nom} {doctor.prenom}
                          </span>
                          <span className="doctor-specialty">{doctor.specialite || 'N/A'}</span>
                        </div>
                        <div className="doctor-stats">
                          <span className="doctor-count">{doctor.count} RDV</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-message">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prochains RDV et Groupes sanguins */}
          <div className="dashboard-row">
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Prochains Rendez-vous</h2>
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/appointments')}
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
                          <div className="appointment-doctor">
                            Dr. {apt.medecin_nom} {apt.medecin_prenom}
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

            <div className="dashboard-card">
              <div className="card-header">
                <h2>Patients par Groupe Sanguin</h2>
              </div>
              <div className="card-body">
                {stats?.patients?.byBloodGroup && stats.patients.byBloodGroup.length > 0 ? (
                  <div className="blood-groups-grid">
                    {stats.patients.byBloodGroup.map((group, index) => (
                      <div key={index} className="blood-group-card">
                        <div className="blood-icon">
                          <MdBloodtype />
                        </div>
                        <div className="blood-info">
                          <span className="blood-type">{group.groupe_sanguin}</span>
                          <span className="blood-count">{group.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-message">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activités récentes */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Activités Récentes</h2>
            </div>
            <div className="card-body">
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                <div className="activities-list">
                  {stats.recentActivities.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        <MdPerson />
                      </div>
                      <div className="activity-content">
                        <p className="activity-text">
                          Nouveau patient enregistré : <strong>{activity.nom} {activity.prenom}</strong>
                        </p>
                        <span className="activity-meta">
                          N° Dossier : {activity.numero_dossier} • {formatDate(activity.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-message">
                  <p>Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;