import React from 'react';
import useAuth from '../hooks/useAuth';
import './ReceptionistDashboard.css';

const ReceptionistDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard Réceptionniste</h1>
        <p>Bienvenue, {user?.prenom} {user?.nom}</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>RDV Aujourd'hui</h3>
            <p className="stat-value">24</p>
            <span className="stat-label">15 confirmés</span>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">🏥</div>
          <div className="stat-content">
            <h3>Nouveaux Patients</h3>
            <p className="stat-value">8</p>
            <span className="stat-label">Cette semaine</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Factures</h3>
            <p className="stat-value">7</p>
            <span className="stat-label">En attente</span>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">📞</div>
          <div className="stat-content">
            <h3>Appels</h3>
            <p className="stat-value">23</p>
            <span className="stat-label">Aujourd'hui</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>Planning du jour</h2>
          <p>Le planning des rendez-vous sera affiché ici...</p>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;