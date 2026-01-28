import React from 'react';
import useAuth from '../hooks/useAuth';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Mon Espace Patient</h1>
        <p>Bienvenue, {user?.prenom} {user?.nom}</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Prochain RDV</h3>
            <p className="stat-value">2</p>
            <span className="stat-label">Rendez-vous à venir</span>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">🩺</div>
          <div className="stat-content">
            <h3>Consultations</h3>
            <p className="stat-value">12</p>
            <span className="stat-label">Total consultations</span>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">💊</div>
          <div className="stat-content">
            <h3>Ordonnances</h3>
            <p className="stat-value">5</p>
            <span className="stat-label">Disponibles</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Factures</h3>
            <p className="stat-value">1</p>
            <span className="stat-label">En attente</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>Mes informations médicales</h2>
          <p>Vos informations seront affichées ici...</p>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;