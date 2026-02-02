const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();
const { testConnection } = require('./config/database');

// Créer l'application Express
const app = express();

// ⭐ CORS Configuration - AVANT helmet
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ⭐ Helmet avec configuration pour permettre les images cross-origin
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// ⭐⭐⭐ Dossier public pour les fichiers uploadés avec headers CORS
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Route de test
app.get('/', (req, res) => {
  res.json({
    message: 'API Hospital Management System',
    version: '1.0.0',
    status: 'running'
  });
});

const myPatientRoutes = require('./routes/myPatientRoutes');

// ⭐ Routes API - Nettoyées (pas de doublons)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes')); 
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/consultations', require('./routes/consultationRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/my-appointments', require('./routes/myAppointmentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/my-patients', myPatientRoutes);
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/dashboard/patient', require('./routes/patientDashboardRoutes'));

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Impossible de se connecter à la base de données');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`- Serveur démarré sur le port ${PORT}`);
      console.log(`- Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`- URL: http://localhost:${PORT}`);
      console.log('=================================');
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error.message);
    process.exit(1);
  }
};

startServer();