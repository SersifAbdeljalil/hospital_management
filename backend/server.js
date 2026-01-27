const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { testConnection } = require('./config/database');

// Créer l'application Express
const app = express();

// Middlewares globaux
app.use(helmet()); // Sécurité des headers HTTP
app.use(cors()); // CORS
app.use(express.json()); // Parser JSON
app.use(express.urlencoded({ extended: true })); // Parser URL-encoded

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // max 100 requêtes par IP
});
app.use('/api/', limiter);

// Dossier public pour les fichiers uploadés
app.use('/uploads', express.static('uploads'));

// Route de test
app.get('/', (req, res) => {
    res.json({
        message: 'API Hospital Management System',
        version: '1.0.0',
        status: 'running'
    });
});

// Routes API (à ajouter progressivement)
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/patients', require('./routes/patientRoutes'));
// app.use('/api/appointments', require('./routes/appointmentRoutes'));
// app.use('/api/consultations', require('./routes/consultationRoutes'));
// app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
// app.use('/api/billing', require('./routes/billingRoutes'));
// app.use('/api/logs', require('./routes/logRoutes'));

// Middleware de gestion des erreurs (à la fin)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erreur serveur interne',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Route 404 - DOIT ÊTRE LA DERNIÈRE ROUTE
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
        // Tester la connexion à la base de données
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ Impossible de se connecter à la base de données');
            process.exit(1);
        }
        
        // Démarrer le serveur
        app.listen(PORT, () => {
            console.log('=================================');
            console.log(`🚀 Serveur démarré sur le port ${PORT}`);
            console.log(`📡 Mode: ${process.env.NODE_ENV}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log('=================================');
        });
    } catch (error) {
        console.error('❌ Erreur au démarrage du serveur:', error.message);
        process.exit(1);
    }
};

startServer();