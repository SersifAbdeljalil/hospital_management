const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Créer le dossier uploads/pdfs s'il n'existe pas
const pdfDir = path.join(__dirname, '../uploads/pdfs');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

// Chemin du logo
const logoPath = path.join(__dirname, 'image.png');

// Palette de couleurs SIGMAX MEDICAL
const COLORS = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  secondary: '#009688',
  accent: '#FF9800',
  textPrimary: '#263238',
  textSecondary: '#546E7A',
  textMuted: '#90A4AE',
  border: '#E0E0E0',
  bgLight: '#F5F5F5',
  white: '#FFFFFF'
};

// Fonction pour dessiner une section avec en-tête coloré
const drawSection = (doc, title, y, color = COLORS.primary) => {
  doc
    .fillColor(color)
    .rect(50, y, 3, 10)
    .fill();

  doc
    .fontSize(8.5)
    .fillColor(COLORS.textPrimary)
    .font('Helvetica-Bold')
    .text(title, 58, y);

  return y + 14;
};

// Fonction pour dessiner une box d'information
const drawInfoBox = (doc, x, y, width, height, bgColor = COLORS.bgLight) => {
  doc
    .fillColor(bgColor)
    .rect(x, y, width, height)
    .fill()
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .rect(x, y, width, height)
    .stroke();
};

exports.generateAppointmentPDF = async (appointmentData) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `RDV-${appointmentData.id}-${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, fileName);

      const doc = new PDFDocument({ 
        margin: 30,
        size: 'A4',
        bufferPages: false,
        autoFirstPage: true
      });
      
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Hauteur maximale de la page A4
      const maxPageHeight = 842; // A4 height in points
      const footerHeight = 18;
      const maxContentHeight = maxPageHeight - footerHeight - 30; // 30 = bottom margin

      // ==================== EN-TÊTE ====================
      let currentY = 30;

      // Logo (si disponible)
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, currentY, { width: 45, height: 45 });
        } catch (error) {
          console.log('Logo non chargé:', error.message);
        }
      }

      // Informations de l'établissement
      doc
        .fontSize(13)
        .fillColor(COLORS.primary)
        .font('Helvetica-Bold')
        .text('SIGMAX MEDICAL', 400, currentY, { align: 'right' });

      doc
        .fontSize(6.5)
        .fillColor(COLORS.textSecondary)
        .font('Helvetica')
        .text('Centre Médical Avancé', 400, currentY + 16, { align: 'right' })
        .text('Avenue Hassan II, Rabat', 400, currentY + 25, { align: 'right' })
        .text('Tél: +212 500-022233', 400, currentY + 34, { align: 'right' })
        .text('contact@sigmaxmedical.ma', 400, currentY + 43, { align: 'right' });

      currentY = 90;

      // Bande de titre principale
      doc
        .rect(50, currentY, 495, 26)
        .fillAndStroke(COLORS.primary, COLORS.primaryDark);

      doc
        .fontSize(13)
        .fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .text('CONFIRMATION DE RENDEZ-VOUS', 50, currentY + 7, { 
          width: 495, 
          align: 'center' 
        });

      currentY += 32;

      // Numéro de rendez-vous
      doc
        .fontSize(6)
        .fillColor(COLORS.textMuted)
        .font('Helvetica')
        .text(`N° RDV: ${appointmentData.id} | Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 
          50, currentY, { align: 'center' });

      currentY += 12;

      // ==================== INFORMATIONS DU RENDEZ-VOUS ====================
      currentY = drawSection(doc, 'DÉTAILS DU RENDEZ-VOUS', currentY, COLORS.primary);

      drawInfoBox(doc, 50, currentY, 495, 46, COLORS.bgLight);

      const dateRdv = new Date(appointmentData.date_heure);
      const dateFormatted = dateRdv.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const heureFormatted = dateRdv.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      doc
        .fontSize(7)
        .fillColor(COLORS.textSecondary)
        .font('Helvetica-Bold')
        .text('Date:', 60, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(dateFormatted, 60, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Heure:', 320, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(heureFormatted, 320, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Durée:', 60, currentY + 30)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(`${appointmentData.duree_minutes || 30} minutes`, 90, currentY + 30);

      if (appointmentData.salle) {
        doc
          .font('Helvetica-Bold')
          .fillColor(COLORS.textSecondary)
          .text('Salle:', 320, currentY + 30)
          .font('Helvetica')
          .fillColor(COLORS.textPrimary)
          .text(appointmentData.salle, 350, currentY + 30);
      }

      currentY += 56;

      // ==================== INFORMATIONS PATIENT ====================
      currentY = drawSection(doc, ' INFORMATIONS PATIENT', currentY, COLORS.secondary);

      drawInfoBox(doc, 50, currentY, 495, 40);

      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Nom complet:', 60, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(`${appointmentData.patient_prenom} ${appointmentData.patient_nom}`, 60, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('N° Dossier:', 320, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(appointmentData.numero_dossier, 320, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Téléphone:', 60, currentY + 27)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(appointmentData.patient_telephone || 'N/A', 110, currentY + 27);

      currentY += 50;

      // ==================== INFORMATIONS MÉDECIN ====================
      currentY = drawSection(doc, '⚕️ PRATICIEN', currentY, COLORS.secondary);

      drawInfoBox(doc, 50, currentY, 495, 32);

      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Médecin:', 60, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(`Dr. ${appointmentData.medecin_nom} ${appointmentData.medecin_prenom}`, 60, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Spécialité:', 320, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(appointmentData.specialite || 'Médecine générale', 320, currentY + 15);

      currentY += 42;

      // ==================== MOTIF (seulement si présent et espace disponible) ====================
      if (appointmentData.motif && currentY < maxContentHeight - 200) {
        currentY = drawSection(doc, ' MOTIF', currentY, COLORS.accent);

        drawInfoBox(doc, 50, currentY, 495, 24);

        doc
          .fontSize(7)
          .font('Helvetica')
          .fillColor(COLORS.textPrimary)
          .text(appointmentData.motif, 60, currentY + 6, { 
            width: 475,
            height: 14,
            ellipsis: true
          });

        currentY += 34;
      }

      // ==================== INSTRUCTIONS ====================
      currentY = drawSection(doc, 'INSTRUCTIONS', currentY, COLORS.accent);

      doc
        .fontSize(6)
        .font('Helvetica')
        .fillColor(COLORS.textSecondary)
        .text('• Arrivez 10 minutes avant l\'heure', 60, currentY)
        .text('• Prévenez 24h à l\'avance en cas d\'empêchement', 60, currentY + 8)
        .text('• Apportez votre carte CNSS/CNOPS et pièce d\'identité', 60, currentY + 16);

      currentY += 30;

      // ==================== SIGNATURES ====================
      doc
        .strokeColor(COLORS.border)
        .lineWidth(0.5)
        .moveTo(50, currentY)
        .lineTo(545, currentY)
        .stroke();

      currentY += 6;

      doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(COLORS.textPrimary)
        .text('SIGNATURES', 50, currentY, { align: 'center' });

      currentY += 12;

      const signBoxWidth = 230;
      const signBoxHeight = 55;
      const spacing = 15;

      // Signature Patient
      doc
        .strokeColor(COLORS.border)
        .lineWidth(0.8)
        .rect(50, currentY, signBoxWidth, signBoxHeight)
        .stroke();

      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Signature du Patient', 58, currentY + 6);

      doc
        .fontSize(6)
        .font('Helvetica')
        .fillColor(COLORS.textMuted)
        .text('(Lu et approuvé)', 58, currentY + 16);

      doc
        .fontSize(6)
        .fillColor(COLORS.textMuted)
        .text('Date: ___/___/______', 58, currentY + signBoxHeight - 12);

      // Signature Médecin
      doc
        .strokeColor(COLORS.border)
        .lineWidth(0.8)
        .rect(50 + signBoxWidth + spacing, currentY, signBoxWidth, signBoxHeight)
        .stroke();

      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Signature et Cachet du Médecin', 58 + signBoxWidth + spacing, currentY + 6);

      doc
        .fontSize(6)
        .fillColor(COLORS.textMuted)
        .text('Date: ___/___/______', 58 + signBoxWidth + spacing, currentY + signBoxHeight - 12);

      currentY += signBoxHeight + 8;

      // ==================== PIED DE PAGE ====================
      doc
        .strokeColor(COLORS.border)
        .lineWidth(0.5)
        .moveTo(50, currentY)
        .lineTo(545, currentY)
        .stroke();

      currentY += 5;

      doc
        .fontSize(5)
        .font('Helvetica')
        .fillColor(COLORS.textMuted)
        .text(
          'Document confidentiel. Toute divulgation non autorisée est interdite.',
          50,
          currentY,
          { width: 495, align: 'center' }
        );

      // Barre de pied colorée (position fixe en bas)
      const footerY = maxPageHeight - footerHeight;
      doc
        .rect(0, footerY, doc.page.width, footerHeight)
        .fillAndStroke(COLORS.primary, COLORS.primaryDark);

      doc
        .fontSize(6)
        .fillColor(COLORS.white)
        .font('Helvetica')
        .text(
          'SIGMAX MEDICAL © 2026 - Système d\'Information Hospitalier',
          0,
          footerY + 6,
          { width: doc.page.width, align: 'center' }
        );

      // Finaliser le PDF
      doc.end();

      stream.on('finish', () => {
        resolve({
          fileName,
          filePath,
          relativePath: `/uploads/pdfs/${fileName}`
        });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};