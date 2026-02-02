const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true pour port 465, false pour les autres ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Pour éviter les problèmes de certificat en développement
  }
});

// Vérifier la configuration au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.log(' Erreur de configuration email:', error);
  } else {
    console.log(' Serveur email prêt à envoyer des messages');
  }
});

module.exports = transporter;