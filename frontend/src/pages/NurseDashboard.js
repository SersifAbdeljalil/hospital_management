import React from 'react';
import useAuth from '../hooks/useAuth';
import './NurseDashboard.css';

const NurseDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard Infirmier</h1>
        <p>Bienvenue, {user?.prenom} {user?.nom}</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon">🏥</div>
          <div className="stat-content">
            <h3>Patients du Jour</h3>
            <p className="stat-value">18</p>
            <span className="stat-label">À préparer</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Tâches</h3>
            <p className="stat-value">12</p>
            <span className="stat-label">4 en attente</span>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">🩺</div>
          <div className="stat-content">
            <h3>Soins Réalisés</h3>
            <p className="stat-value">34</p>
            <span className="stat-label">Aujourd'hui</span>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Dossiers</h3>
            <p className="stat-value">8</p>
            <span className="stat-label">À compléter</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>Tâches du jour</h2>
          <p>Vos tâches seront affichées ici...</p>
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;