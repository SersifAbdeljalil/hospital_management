import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import correct du AuthProvider
import { AuthProvider } from './context/AuthContext';

// Import des composants
import ProtectedRoute from './components/ProtectedRoute';

// Pages Auth
import Login from './pages/Login';

// Pages Dashboards
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import PatientDashboard from './pages/PatientDashboard';

// Pages communes
import Patients from './pages/Patients';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Consultations from './pages/Consultations';
import Billing from './pages/Billing';
import Users from './pages/Users';
import Logs from './pages/Logs';
import Settings from './pages/Settings'; // ⭐ Ajout de Settings
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* ========== ROUTE PUBLIQUE ========== */}
            <Route path="/login" element={<Login />} />

            {/* Redirection de la racine vers login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ========== ROUTES ADMIN ========== */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="/logs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Logs />
                </ProtectedRoute>
              }
            />

            {/* ========== ROUTES MÉDECIN ========== */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['medecin']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            {/* ========== ROUTES INFIRMIER ========== */}
            <Route
              path="/nurse/dashboard"
              element={
                <ProtectedRoute allowedRoles={['infirmier']}>
                  <NurseDashboard />
                </ProtectedRoute>
              }
            />

            {/* ========== ROUTES RÉCEPTIONNISTE ========== */}
            <Route
              path="/receptionist/dashboard"
              element={
                <ProtectedRoute allowedRoles={['receptionniste']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              }
            />

            {/* ========== ROUTES PATIENT ========== */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />

            {/* ========== ROUTES PARTAGÉES ========== */}
            
            {/* Patients - Admin, Médecin, Infirmier, Réceptionniste */}
            <Route
              path="/patients"
              element={
                <ProtectedRoute allowedRoles={['admin', 'medecin', 'infirmier', 'receptionniste']}>
                  <Patients />
                </ProtectedRoute>
              }
            />

            {/* Médecins - Admin, Réceptionniste */}
            <Route
              path="/doctors"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionniste']}>
                  <Doctors />
                </ProtectedRoute>
              }
            />

            {/* Rendez-vous - Tous les utilisateurs connectés */}
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />

            {/* Consultations - Admin, Médecin, Infirmier, Patient */}
            <Route
              path="/consultations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'medecin', 'infirmier', 'patient']}>
                  <Consultations />
                </ProtectedRoute>
              }
            />

            {/* ⭐ Facturation/Paiements - Admin, Réceptionniste, Patient */}
            <Route
              path="/billing"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionniste', 'patient']}>
                  <Billing />
                </ProtectedRoute>
              }
            />

            {/* ⭐ Alias pour /payments → /billing */}
            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionniste', 'patient']}>
                  <Billing />
                </ProtectedRoute>
              }
            />

            {/* ⭐ Paramètres - Admin */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Utilisateurs (si différent de /admin/users) */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* ========== ROUTE 404 ========== */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Toast Container pour les notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;