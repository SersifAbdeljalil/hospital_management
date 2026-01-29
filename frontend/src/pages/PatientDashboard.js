import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import patientDashboardService from '../services/patientDashboardService';
import notificationService from '../services/notificationservice';
import useAuth from '../hooks/useAuth';
import {
  MdDashboard,
  MdCalendarToday,
  MdLocalHospital,
  MdMedication,
  MdPayment,
  MdPerson,
  MdRefresh,
  MdLogout,
  MdMenu,
  MdClose,
  MdCameraAlt,
  MdDelete,
  MdNotifications,
  MdNotificationsActive,
  MdNotificationsNone,
  MdDoneAll,
  MdInfo,
  MdAttachMoney,
  MdCheckCircle,
  MdWarning,
  MdCancel,
  MdChevronRight,
  MdAccessTime,
  MdSchedule
} from 'react-icons/md';
import { FaUserInjured, FaHeartbeat } from 'react-icons/fa';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  
  // États pour les notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchUnreadCount();
    
    // Actualiser le compteur de notifications toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Charger les notifications quand le panneau s'ouvre
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await patientDashboardService.getPatientStats();
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

  // Récupérer les notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await notificationService.getNotifications();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Erreur fetchNotifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Récupérer le nombre de notifications non lues
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error('Erreur fetchUnreadCount:', error);
    }
  };

  // Marquer une notification comme lue
  const handleMarkAsRead = async (id) => {
    try {
      const response = await notificationService.markAsRead(id);
      if (response.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, is_read: true } : notif
          )
        );
        fetchUnreadCount();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (response.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        toast.success('Toutes les notifications marquées comme lues');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Supprimer une notification
  const handleDeleteNotification = async (id) => {
    try {
      const response = await notificationService.deleteNotification(id);
      if (response.success) {
        setNotifications(prev => prev.filter(notif => notif.id !== id));
        fetchUnreadCount();
        toast.success('Notification supprimée');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Obtenir l'icône de la notification
  const getNotificationIcon = (type) => {
    const icons = {
      appointment_created: <MdCalendarToday />,
      appointment_updated: <MdCalendarToday />,
      appointment_cancelled: <MdCancel />,
      appointment_reminder: <MdNotificationsActive />,
      consultation_created: <MdCheckCircle />,
      prescription_created: <MdMedication />,
      payment_reminder: <MdPayment />,
      message: <MdInfo />
    };
    return icons[type] || <MdNotifications />;
  };

  // Obtenir la couleur de la notification
  const getNotificationColor = (type) => {
    const colors = {
      appointment_created: '#4CAF50',
      appointment_updated: '#2196F3',
      appointment_cancelled: '#F44336',
      appointment_reminder: '#FF9800',
      consultation_created: '#9C27B0',
      prescription_created: '#00BCD4',
      payment_reminder: '#FF5722',
      message: '#2196F3'
    };
    return colors[type] || '#757575';
  };

  // Formater la date de notification
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getNavigationItems = () => {
    return [
      {
        section: 'Principal',
        items: [
          { path: '/patient/dashboard', icon: <MdDashboard />, text: 'Dashboard' }
        ]
      },
      {
        section: 'Mon Suivi Médical',
        items: [
          { 
            path: '/appointments', 
            icon: <MdCalendarToday />, 
            text: 'Mes Rendez-vous', 
            badge: stats?.appointments?.upcoming || 0 
          },
          { path: '/consultations', icon: <MdLocalHospital />, text: 'Mes Consultations' },
          { 
            path: '/my-prescriptions', 
            icon: <MdMedication />, 
            text: 'Mes Ordonnances',
            badge: stats?.prescriptions?.pending || 0
          }
        ]
      },
      {
        section: 'Finances',
        items: [
          { 
            path: '/billing', 
            icon: <MdPayment />, 
            text: 'Mes Factures',
            badge: stats?.invoices?.unpaid?.count || 0
          }
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

  const getPhotoUrl = () => {
    if (user?.photo_profil) {
      const baseURL = 'http://localhost:5000';
      
      if (user.photo_profil.startsWith('http')) {
        return user.photo_profil;
      }
      
      if (user.photo_profil.startsWith('/uploads')) {
        return `${baseURL}${user.photo_profil}`;
      }
      
      return `${baseURL}/uploads/profiles/${user.photo_profil}`;
    }
    return null;
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
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarOpen ? <MdClose /> : <MdMenu />}
      </button>

      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      ></div>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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

        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar-container">
              {getPhotoUrl() ? (
                <img 
                  src={getPhotoUrl()} 
                  alt="Photo de profil" 
                  className="user-avatar-image"
                />
              ) : (
                <div className="user-avatar">
                  {getUserInitials()}
                </div>
              )}
            </div>

            <div className="user-details">
              <p className="user-name">
                {user?.prenom} {user?.nom}
              </p>
              <span className="user-role">Patient</span>
            </div>
          </div>
        </div>

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

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <MdLogout />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="patient-dashboard">
          {/* Header avec notifications */}
          <div className="dashboard-header">
            <div className="header-content">
              <h1>Mon Tableau de Bord</h1>
              <p>Bienvenue, {user?.prenom} {user?.nom}</p>
            </div>
            
            <div className="header-actions">
              {/* Bouton Notifications */}
              <button 
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                {unreadCount > 0 ? <MdNotificationsActive /> : <MdNotifications />}
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              <button 
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <MdRefresh className={refreshing ? 'spinning' : ''} />
                Actualiser
              </button>
            </div>
          </div>

          {/* Panneau de notifications */}
          {showNotifications && (
            <>
              <div 
                className="notifications-overlay" 
                onClick={() => setShowNotifications(false)} 
              />
              <div className="notifications-panel">
                <div className="notifications-header">
                  <div className="header-title">
                    <MdNotifications />
                    <h2>Notifications</h2>
                    {unreadCount > 0 && (
                      <span className="unread-badge">{unreadCount}</span>
                    )}
                  </div>
                  <div className="header-actions">
                    {notifications.length > 0 && unreadCount > 0 && (
                      <button
                        className="btn-icon"
                        onClick={handleMarkAllAsRead}
                        title="Tout marquer comme lu"
                      >
                        <MdDoneAll />
                      </button>
                    )}
                    <button
                      className="btn-icon"
                      onClick={() => setShowNotifications(false)}
                      title="Fermer"
                    >
                      <MdClose />
                    </button>
                  </div>
                </div>

                <div className="notifications-body">
                  {loadingNotifications ? (
                    <div className="notifications-loading">
                      <div className="spinner"></div>
                      <p>Chargement...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="notifications-empty">
                      <MdNotificationsNone className="empty-icon" />
                      <p>Aucune notification</p>
                    </div>
                  ) : (
                    <div className="notifications-list">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                          onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                        >
                          <div
                            className="notification-icon"
                            style={{ backgroundColor: getNotificationColor(notification.type) }}
                          >
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="notification-content">
                            <h3 className="notification-title">{notification.title}</h3>
                            <p className="notification-message">{notification.message}</p>
                            <span className="notification-time">
                              {formatNotificationDate(notification.created_at)}
                            </span>
                          </div>

                          <button
                            className="notification-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            title="Supprimer"
                          >
                            <MdDelete />
                          </button>

                          {!notification.is_read && (
                            <div className="unread-indicator"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">
                <MdCalendarToday />
              </div>
              <div className="stat-content">
                <h3>RDV à Venir</h3>
                <p className="stat-value">{stats?.appointments?.upcoming || 0}</p>
                <span className="stat-label">
                  {stats?.appointments?.month || 0} ce mois
                </span>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">
                <MdLocalHospital />
              </div>
              <div className="stat-content">
                <h3>Consultations</h3>
                <p className="stat-value">{stats?.consultations?.total || 0}</p>
                <span className="stat-label">
                  Total consultations
                </span>
              </div>
            </div>

            <div className="stat-card stat-info">
              <div className="stat-icon">
                <MdMedication />
              </div>
              <div className="stat-content">
                <h3>Ordonnances</h3>
                <p className="stat-value">{stats?.prescriptions?.total || 0}</p>
                <span className="stat-label">
                  {stats?.prescriptions?.pending || 0} en attente
                </span>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">
                <MdPayment />
              </div>
              <div className="stat-content">
                <h3>Factures Impayées</h3>
                <p className="stat-value">{stats?.invoices?.unpaid?.count || 0}</p>
                <span className="stat-label">
                  {stats?.invoices?.unpaid?.montant?.toFixed(2) || 0} MAD
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="dashboard-row">
            {/* Prochains Rendez-vous */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Mes Prochains Rendez-vous</h2>
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
                  {stats?.appointments?.upcomingDetails && stats.appointments.upcomingDetails.length > 0 ? (
                    stats.appointments.upcomingDetails.map((apt) => (
                      <div key={apt.id} className="appointment-item">
                        <div className="appointment-time">
                          <MdCalendarToday />
                          <span>{formatDate(apt.date_heure)}</span>
                        </div>
                        <div className="appointment-details">
                          <div className="appointment-doctor">
                            <MdPerson />
                            <span>Dr. {apt.medecin_nom} {apt.medecin_prenom}</span>
                          </div>
                          <div className="appointment-specialty">
                            {apt.specialite}
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

            {/* Dernière Consultation */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Dernière Consultation</h2>
              </div>
              <div className="card-body">
                {stats?.consultations?.last ? (
                  <div className="last-consultation">
                    <div className="consultation-doctor">
                      <div className="doctor-avatar">
                        <FaHeartbeat />
                      </div>
                      <div className="doctor-info">
                        <h3>Dr. {stats.consultations.last.medecin_nom} {stats.consultations.last.medecin_prenom}</h3>
                        <p className="specialty">{stats.consultations.last.specialite}</p>
                      </div>
                    </div>
                    <div className="consultation-date">
                      <MdCalendarToday />
                      <span>{formatDate(stats.consultations.last.date_consultation)}</span>
                    </div>
                    {stats.consultations.last.diagnostic && (
                      <div className="consultation-diagnostic">
                        <h4>Diagnostic:</h4>
                        <p>{stats.consultations.last.diagnostic}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-message">
                    <MdLocalHospital />
                    <p>Aucune consultation enregistrée</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ordonnances Récentes et Rendez-vous par Statut */}
          <div className="dashboard-row">
            {/* Ordonnances Récentes */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2>Ordonnances Récentes</h2>
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/my-prescriptions')}
                >
                  Voir tout
                  <MdChevronRight />
                </button>
              </div>
              <div className="card-body">
                <div className="prescriptions-list">
                  {stats?.prescriptions?.recent && stats.prescriptions.recent.length > 0 ? (
                    stats.prescriptions.recent.map((prescription, index) => (
                      <div key={index} className="prescription-item">
                        <div className="prescription-icon">
                          <MdMedication />
                        </div>
                        <div className="prescription-info">
                          <div className="prescription-doctor">
                            Dr. {prescription.medecin_nom} {prescription.medecin_prenom}
                          </div>
                          <div className="prescription-date">
                            {formatDate(prescription.date_prescription)}
                          </div>
                          {prescription.diagnostic && (
                            <div className="prescription-diagnostic">
                              {prescription.diagnostic}
                            </div>
                          )}
                        </div>
                        <span className={`prescription-status status-${prescription.statut_paiement || 'en_attente'}`}>
                          {prescription.statut_paiement === 'payee' ? 'Payée' : 'En attente'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="empty-message">
                      <MdMedication />
                      <p>Aucune ordonnance</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rendez-vous par Statut */}
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
          </div>

          {/* Information Financière */}
          {stats?.invoices?.unpaid?.count > 0 && (
            <div className="dashboard-card financial-alert">
              <div className="card-header">
                <h2>
                  <MdWarning />
                  Factures en Attente
                </h2>
              </div>
              <div className="card-body">
                <div className="financial-summary">
                  <div className="financial-item">
                    <span className="label">Factures impayées:</span>
                    <span className="value">{stats.invoices.unpaid.count}</span>
                  </div>
                  <div className="financial-item">
                    <span className="label">Montant total:</span>
                    <span className="value highlight">{stats.invoices.unpaid.montant.toFixed(2)} MAD</span>
                  </div>
                  <button 
                    className="btn-pay-now"
                    onClick={() => navigate('/billing')}
                  >
                    <MdPayment />
                    Voir mes factures
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PatientDashboard;