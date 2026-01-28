import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import invoiceService from '../services/invoiceService';
import useAuth from '../hooks/useAuth';
import {
  MdSearch,
  MdAdd,
  MdVisibility,
  MdPayment,
  MdReceipt,
  MdCancel
} from 'react-icons/md';
import './Billing.css';

const Billing = () => {
  const { user } = useAuth();
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchInvoices();
    if (user?.role !== 'patient') {
      fetchStats();
    }
  }, [currentPage, searchTerm]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await invoiceService.getAllInvoices({
        search: searchTerm,
        page: currentPage,
        limit: 10
      });

      if (response.success) {
        setInvoices(response.data);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      toast.error(error.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await invoiceService.getInvoiceStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount || 0);
  };

  return (
    <div className="billing-page">
      <div className="billing-header">
        <div className="header-left">
          <h1>Facturation</h1>
          <p>{invoices.length} facture(s)</p>
        </div>
      </div>

      {stats && user?.role !== 'patient' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <MdReceipt />
            </div>
            <div className="stat-content">
              <h3>Total Facturé</h3>
              <p className="stat-value">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon green">
              <MdPayment />
            </div>
            <div className="stat-content">
              <h3>Payé</h3>
              <p className="stat-value">{formatCurrency(stats.totalPaid)}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon red">
              <MdCancel />
            </div>
            <div className="stat-content">
              <h3>Impayé</h3>
              <p className="stat-value">{formatCurrency(stats.totalUnpaid)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="search-bar">
        <MdSearch className="search-icon" />
        <input
          type="text"
          placeholder="Rechercher par numéro, patient..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="invoices-table-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <MdReceipt className="empty-icon" />
            <p>Aucune facture trouvée</p>
          </div>
        ) : (
          <table className="invoices-table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Montant TTC</th>
                <th>Payé</th>
                <th>Restant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <span className="invoice-number">{invoice.numero_facture}</span>
                  </td>
                  <td>
                    {new Date(invoice.date_emission).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    <div className="patient-info">
                      <strong>{invoice.patient_nom} {invoice.patient_prenom}</strong>
                      <span className="numero-dossier">{invoice.numero_dossier}</span>
                    </div>
                  </td>
                  <td className="amount">{formatCurrency(invoice.montant_ttc)}</td>
                  <td className="amount paid">{formatCurrency(invoice.montant_paye)}</td>
                  <td className="amount remaining">{formatCurrency(invoice.montant_restant)}</td>
                  <td>
                    <span className={`badge badge-${invoice.statut_paiement}`}>
                      {invoice.statut_paiement === 'non_payee' && 'Non Payée'}
                      {invoice.statut_paiement === 'partiellement_payee' && 'Partielle'}
                      {invoice.statut_paiement === 'payee' && 'Payée'}
                      {invoice.statut_paiement === 'annulee' && 'Annulée'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-view"
                        title="Voir"
                      >
                        <MdVisibility />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </button>
          
          <span className="pagination-info">
            Page {currentPage} sur {totalPages}
          </span>
          
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default Billing;