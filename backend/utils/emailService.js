const transporter = require('../config/email');
require('dotenv').config();

/**
 * Envoyer un email de réinitialisation de mot de passe avec code de vérification
 * @param {string} email - Email du destinataire
 * @param {string} verificationCode - Code de vérification à 6 caractères
 * @param {string} nom - Nom de l'utilisateur
 * @param {string} prenom - Prénom de l'utilisateur
 */
exports.sendResetPasswordEmail = async (email, verificationCode, nom, prenom) => {
  try {
    const mailOptions = {
      from: `"SIGMAX MEDICAL" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Code de réinitialisation de mot de passe - SIGMAX MEDICAL',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #263238;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: bold;
            }
            .hospital-info {
              font-size: 11px;
              margin-top: 8px;
              opacity: 0.95;
              line-height: 1.4;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .content h2 {
              color: #263238;
              font-size: 20px;
              margin: 0 0 15px 0;
            }
            .code-box {
              background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
              border: 3px solid #2196F3;
              padding: 30px;
              margin: 25px 0;
              text-align: center;
              border-radius: 10px;
            }
            .code {
              font-size: 42px;
              font-weight: bold;
              color: #1976D2;
              letter-spacing: 8px;
              font-family: 'Courier New', monospace;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            }
            .code-label {
              font-size: 14px;
              color: #546E7A;
              margin-bottom: 10px;
              font-weight: 600;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #E0E0E0;
              color: #90A4AE;
              font-size: 12px;
            }
            .warning {
              background-color: #FFF3E0;
              border-left: 4px solid #FF9800;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning strong {
              color: #FF9800;
            }
            .instructions {
              background-color: #F5F5F5;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .instructions ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 8px 0;
              color: #546E7A;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Code de Vérification</h1>
              <div class="hospital-info">
                SIGMAX MEDICAL<br>
                Centre Médical Avancé<br>
                Avenue Hassan II, Rabat
              </div>
            </div>
            <div class="content">
              <h2>Bonjour ${prenom} ${nom},</h2>
              <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
              <p>Voici votre code de vérification :</p>
              
              <div class="code-box">
                <div class="code-label">VOTRE CODE DE VÉRIFICATION</div>
                <div class="code">${verificationCode}</div>
              </div>
              
              <div class="instructions">
                <strong>Comment utiliser ce code :</strong>
                <ol>
                  <li>Retournez sur la page de réinitialisation</li>
                  <li>Entrez ce code de vérification</li>
                  <li>Créez votre nouveau mot de passe</li>
                </ol>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important :</strong> Ce code est valable pendant 15 minutes seulement.
              </div>
              
              <p style="color: #546E7A; font-size: 14px;">
                Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email. 
                Votre mot de passe restera inchangé.
              </p>
              
              <p style="margin-top: 30px;">
                Cordialement,<br>
                <strong>L'équipe SIGMAX MEDICAL</strong>
              </p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p style="margin-top: 5px;">Centre Médical Avancé - Avenue Hassan II, Rabat</p>
              <p>Tél: +212 500-022233 | contact@sigmaxmedical.ma</p>
              <p style="margin-top: 10px;">© ${new Date().getFullYear()} SIGMAX MEDICAL - Système d'Information Hospitalier</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email avec code de vérification envoyé:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
};

/**
 * Envoyer un email de bienvenue
 * @param {string} email - Email du destinataire
 * @param {string} nom - Nom de l'utilisateur
 * @param {string} prenom - Prénom de l'utilisateur
 */
exports.sendWelcomeEmail = async (email, nom, prenom) => {
  try {
    const mailOptions = {
      from: `"SIGMAX MEDICAL" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Bienvenue sur SIGMAX MEDICAL',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #263238;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #009688 0%, #00796B 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: bold;
            }
            .hospital-info {
              font-size: 11px;
              margin-top: 8px;
              opacity: 0.95;
              line-height: 1.4;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .content h2 {
              color: #263238;
              font-size: 20px;
              margin: 0 0 15px 0;
            }
            .features {
              background-color: #F5F5F5;
              border-left: 4px solid #009688;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .features ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .features li {
              margin: 8px 0;
              color: #546E7A;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #E0E0E0;
              color: #90A4AE;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Bienvenue !</h1>
              <div class="hospital-info">
                SIGMAX MEDICAL<br>
                Centre Médical Avancé<br>
                Avenue Hassan II, Rabat
              </div>
            </div>
            <div class="content">
              <h2>Bonjour ${prenom} ${nom},</h2>
              <p>Votre compte a été créé avec succès sur la plateforme <strong>SIGMAX MEDICAL</strong>.</p>
              
              <div class="features">
                <strong>Vous pouvez maintenant :</strong>
                <ul>
                  <li>Prendre rendez-vous en ligne</li>
                  <li>Consulter votre dossier médical</li>
                  <li>Suivre vos consultations</li>
                  <li>Gérer vos ordonnances</li>
                </ul>
              </div>
              
              <p>Notre équipe est à votre disposition pour toute question.</p>
              
              <p style="margin-top: 30px;">
                Cordialement,<br>
                <strong>L'équipe SIGMAX MEDICAL</strong>
              </p>
            </div>
            <div class="footer">
              <p>Centre Médical Avancé - Avenue Hassan II, Rabat</p>
              <p>Tél: +212 500-022233 | contact@sigmaxmedical.ma</p>
              <p style="margin-top: 10px;">© ${new Date().getFullYear()} SIGMAX MEDICAL</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de bienvenue envoyé:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    throw error;
  }
};

/**
 * Envoyer une notification de rendez-vous
 * @param {string} email - Email du destinataire
 * @param {object} appointmentData - Données du rendez-vous
 */
exports.sendAppointmentNotification = async (email, appointmentData) => {
  try {
    const { nom, prenom, date, heure, medecin, type } = appointmentData;

    const mailOptions = {
      from: `"SIGMAX MEDICAL" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Confirmation de rendez-vous - SIGMAX MEDICAL',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #263238;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0 0 10px 0;
              font-size: 24px;
              font-weight: bold;
            }
            .hospital-info {
              font-size: 11px;
              margin-top: 8px;
              opacity: 0.95;
              line-height: 1.4;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .content h2 {
              color: #263238;
              font-size: 20px;
              margin: 0 0 15px 0;
            }
            .appointment-details {
              background: linear-gradient(to right, #F5F5F5 0%, #FAFAFA 100%);
              border: 1px solid #E0E0E0;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .appointment-details p {
              margin: 10px 0;
              color: #263238;
            }
            .appointment-details strong {
              color: #2196F3;
              display: inline-block;
              width: 100px;
            }
            .instructions {
              background-color: #E3F2FD;
              border-left: 4px solid #2196F3;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .instructions ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 8px 0;
              color: #546E7A;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #E0E0E0;
              color: #90A4AE;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Rendez-vous confirmé</h1>
              <div class="hospital-info">
                SIGMAX MEDICAL<br>
                Centre Médical Avancé<br>
                Avenue Hassan II, Rabat
              </div>
            </div>
            <div class="content">
              <h2>Bonjour ${prenom} ${nom},</h2>
              <p>Votre rendez-vous a été confirmé avec les détails suivants :</p>
              
              <div class="appointment-details">
                <p><strong>📅 Date :</strong> ${date}</p>
                <p><strong>🕐 Heure :</strong> ${heure}</p>
                <p><strong>👨‍⚕️ Médecin :</strong> ${medecin}</p>
                <p><strong>📋 Type :</strong> ${type}</p>
              </div>
              
              <div class="instructions">
                <strong>📋 Instructions importantes :</strong>
                <ul>
                  <li>Arrivez 10 minutes avant l'heure du rendez-vous</li>
                  <li>Prévenez-nous 24h à l'avance en cas d'empêchement</li>
                  <li>Apportez votre carte CNSS/CNOPS et pièce d'identité</li>
                  <li>Apportez vos anciens examens médicaux si disponibles</li>
                </ul>
              </div>
              
              <p>Notre équipe vous attend avec plaisir.</p>
              
              <p style="margin-top: 30px;">
                Cordialement,<br>
                <strong>L'équipe SIGMAX MEDICAL</strong>
              </p>
            </div>
            <div class="footer">
              <p>Centre Médical Avancé - Avenue Hassan II, Rabat</p>
              <p>Tél: +212 500-022233 | contact@sigmaxmedical.ma</p>
              <p style="margin-top: 10px;">© ${new Date().getFullYear()} SIGMAX MEDICAL</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmation de rendez-vous envoyé:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de rendez-vous:', error);
    throw error;
  }
};