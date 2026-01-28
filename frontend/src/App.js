import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
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
import MyAppointments from './pages/MyAppointments';
import MyPatients from './pages/MyPatients';
import Consultations from './pages/Consultations';
import Billing from './pages/Billing';
import Users from './pages/Users';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// ⭐⭐⭐ NOUVELLES PAGES: ORDONNANCES ⭐⭐⭐
import Prescriptions from './pages/Prescriptions';
import MyPrescriptions from './pages/MyPrescriptions';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* ========== ROUTE PUBLIQUE ========== */}
            <Route path="/login" element={<Login />} />
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
            <Route
              path="/my-appointments"
              element={
                <ProtectedRoute allowedRoles={['medecin']}>
                  <MyAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-patients"
              element={
                <ProtectedRoute allowedRoles={['medecin']}>
                  <MyPatients />
                </ProtectedRoute>
              }
            />
            {/* ⭐ Ordonnances - Médecin */}
            <Route
              path="/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['medecin']}>
                  <Prescriptions />
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
            {/* ⭐ Ordonnances - Patient */}
            <Route
              path="/my-prescriptions"
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <MyPrescriptions />
                </ProtectedRoute>
              }
            />

            {/* ========== ROUTES PARTAGÉES ========== */}
            <Route
              path="/patients"
              element={
                <ProtectedRoute allowedRoles={['admin', 'medecin', 'infirmier', 'receptionniste']}>
                  <Patients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctors"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionniste']}>
                  <Doctors />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consultations"
              element={
                <ProtectedRoute allowedRoles={['admin', 'medecin', 'infirmier', 'patient']}>
                  <Consultations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionniste', 'patient']}>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionniste', 'patient']}>
                  <Billing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              }
            />
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