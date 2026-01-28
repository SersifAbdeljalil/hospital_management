const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Créer le dossier uploads/pdfs/prescriptions s'il n'existe pas
const pdfDir = path.join(__dirname, '../uploads/pdfs/prescriptions');
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
  success: '#4CAF50',
  danger: '#F44336',
  textPrimary: '#263238',
  textSecondary: '#546E7A',
  textMuted: '#90A4AE',
  border: '#E0E0E0',
  bgLight: '#F5F5F5',
  white: '#FFFFFF',
  prescription: '#9C27B0' // Violet pour les ordonnances
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

// Fonction pour calculer l'âge
const calculateAge = (dateNaissance) => {
  if (!dateNaissance) return 'N/A';
  const today = new Date();
  const birthDate = new Date(dateNaissance);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

exports.generatePrescriptionPDF = async (prescriptionData) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `ORDONNANCE-${prescriptionData.numero_ordonnance}-${Date.now()}.pdf`;
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
      const maxPageHeight = 842;
      const footerHeight = 18;
      const maxContentHeight = maxPageHeight - footerHeight - 30;

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
        .fillColor(COLORS.prescription)
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
        .rect(50, currentY, 495, 28)
        .fillAndStroke(COLORS.prescription, '#7B1FA2');

      doc
        .fontSize(14)
        .fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .text('ORDONNANCE MÉDICALE', 50, currentY + 7, { 
          width: 495, 
          align: 'center' 
        });

      currentY += 34;

      // Numéro de l'ordonnance
      doc
        .fontSize(6)
        .fillColor(COLORS.textMuted)
        .font('Helvetica')
        .text(
          `N° Ordonnance: ${prescriptionData.numero_ordonnance} | Date: ${new Date(prescriptionData.date_creation).toLocaleDateString('fr-FR')}`, 
          50, 
          currentY, 
          { align: 'center' }
        );

      currentY += 14;

      // ==================== INFORMATIONS MÉDECIN ====================
      currentY = drawSection(doc, 'PRATICIEN PRESCRIPTEUR', currentY, COLORS.prescription);

      drawInfoBox(doc, 50, currentY, 495, 38);

      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Nom:', 60, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(`Dr. ${prescriptionData.medecin_nom} ${prescriptionData.medecin_prenom}`, 60, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Spécialité:', 320, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(prescriptionData.medecin_specialite || 'Médecine générale', 320, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Téléphone:', 60, currentY + 27)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(prescriptionData.medecin_telephone || 'N/A', 120, currentY + 27);

      currentY += 48;

      // ==================== INFORMATIONS PATIENT ====================
      currentY = drawSection(doc, 'INFORMATIONS PATIENT', currentY, COLORS.secondary);

      const patientAge = calculateAge(prescriptionData.patient_date_naissance);

      drawInfoBox(doc, 50, currentY, 495, 38);

      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Nom complet:', 60, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(`${prescriptionData.patient_prenom} ${prescriptionData.patient_nom}`, 60, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('N° Dossier:', 320, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(prescriptionData.numero_dossier, 320, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Âge/Sexe:', 60, currentY + 27)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(`${patientAge} ans / ${prescriptionData.patient_sexe || 'N/A'}`, 110, currentY + 27);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Téléphone:', 320, currentY + 27)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(prescriptionData.patient_telephone || 'N/A', 380, currentY + 27);

      currentY += 48;

      // ==================== DIAGNOSTIC ====================
      if (prescriptionData.diagnostic) {
        currentY = drawSection(doc, ' DIAGNOSTIC', currentY, COLORS.primary);

        const diagnosticHeight = Math.min(
          Math.ceil(doc.heightOfString(prescriptionData.diagnostic, { width: 475 }) / 7) * 7 + 12,
          50
        );

        drawInfoBox(doc, 50, currentY, 495, diagnosticHeight);

        doc
          .fontSize(7)
          .font('Helvetica')
          .fillColor(COLORS.textPrimary)
          .text(prescriptionData.diagnostic, 60, currentY + 6, { 
            width: 475,
            height: diagnosticHeight - 12,
            ellipsis: true
          });

        currentY += diagnosticHeight + 10;
      }

      // ==================== MÉDICAMENTS ====================
      currentY = drawSection(doc, ' PRESCRIPTION MÉDICAMENTEUSE', currentY, COLORS.danger);

      const medicaments = prescriptionData.medicaments || [];
      
      if (medicaments.length > 0) {
        medicaments.forEach((med, index) => {
          if (currentY > maxContentHeight - 100) {
            doc.addPage();
            currentY = 50;
          }

          // Box pour chaque médicament
          drawInfoBox(doc, 50, currentY, 495, 50, '#FFFFFF');

          // Numéro
          doc
            .fontSize(10)
            .fillColor(COLORS.white)
            .rect(55, currentY + 5, 24, 24)
            .fillAndStroke(COLORS.prescription, '#7B1FA2')
            .fontSize(10)
            .fillColor(COLORS.white)
            .font('Helvetica-Bold')
            .text(`${index + 1}`, 55, currentY + 11, { width: 24, align: 'center' });

          // Nom du médicament
          doc
            .fontSize(9)
            .fillColor(COLORS.textPrimary)
            .font('Helvetica-Bold')
            .text(med.nom || med.name, 85, currentY + 8, { width: 450 });

          // Dosage et forme
          doc
            .fontSize(7)
            .fillColor(COLORS.textSecondary)
            .font('Helvetica')
            .text(
              `${med.dosage || 'N/A'} - ${med.forme || 'comprimés'}`, 
              85, 
              currentY + 20
            );

          // Posologie
          doc
            .fontSize(7)
            .fillColor(COLORS.textPrimary)
            .font('Helvetica-Bold')
            .text('Posologie:', 85, currentY + 30)
            .font('Helvetica')
            .text(med.posologie || 'Selon avis médical', 130, currentY + 30);

          // Durée
          if (med.duree) {
            doc
              .fontSize(7)
              .fillColor(COLORS.textPrimary)
              .font('Helvetica-Bold')
              .text('Durée:', 380, currentY + 30)
              .font('Helvetica')
              .text(med.duree, 410, currentY + 30);
          }

          currentY += 56;
        });
      } else {
        doc
          .fontSize(7)
          .fillColor(COLORS.textMuted)
          .font('Helvetica-Oblique')
          .text('Aucun médicament prescrit', 60, currentY + 6);
        
        currentY += 20;
      }

      // ==================== INSTRUCTIONS ====================
      if (prescriptionData.instructions) {
        if (currentY > maxContentHeight - 80) {
          doc.addPage();
          currentY = 50;
        }

        currentY = drawSection(doc, 'INSTRUCTIONS & RECOMMANDATIONS', currentY, COLORS.accent);

        const instructionsHeight = Math.min(
          Math.ceil(doc.heightOfString(prescriptionData.instructions, { width: 475 }) / 7) * 7 + 12,
          60
        );

        drawInfoBox(doc, 50, currentY, 495, instructionsHeight);

        doc
          .fontSize(7)
          .font('Helvetica')
          .fillColor(COLORS.textPrimary)
          .text(prescriptionData.instructions, 60, currentY + 6, { 
            width: 475,
            height: instructionsHeight - 12,
            ellipsis: true
          });

        currentY += instructionsHeight + 10;
      }

      // ==================== DURÉE DU TRAITEMENT ====================
      if (prescriptionData.duree_traitement) {
        if (currentY > maxContentHeight - 40) {
          doc.addPage();
          currentY = 50;
        }

        drawInfoBox(doc, 50, currentY, 495, 24, '#E8F5E9');

        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .fillColor(COLORS.textSecondary)
          .text('Durée totale du traitement:', 60, currentY + 8)
          .font('Helvetica')
          .fillColor(COLORS.success)
          .fontSize(8)
          .text(prescriptionData.duree_traitement, 180, currentY + 8);

        currentY += 30;
      }

      // ==================== AVERTISSEMENT ====================
      if (currentY > maxContentHeight - 60) {
        doc.addPage();
        currentY = 50;
      }

      drawInfoBox(doc, 50, currentY, 495, 32, '#FFEBEE');

      doc
        .fontSize(6)
        .font('Helvetica-Bold')
        .fillColor(COLORS.danger)
        .text(' IMPORTANT', 60, currentY + 6)
        .font('Helvetica')
        .text(
          'Ne pas dépasser la dose prescrite. Conserver hors de portée des enfants. En cas d\'effets indésirables, consulter immédiatement votre médecin.',
          60,
          currentY + 15,
          { width: 475, align: 'justify' }
        );

      currentY += 38;

      // ==================== SIGNATURES ====================
      if (currentY > maxContentHeight - 80) {
        doc.addPage();
        currentY = 50;
      }

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
      const signBoxHeight = 50;
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
      const footerY = maxPageHeight - footerHeight;
      
      doc
        .strokeColor(COLORS.border)
        .lineWidth(0.5)
        .moveTo(50, footerY - 10)
        .lineTo(545, footerY - 10)
        .stroke();

      doc
        .rect(0, footerY, doc.page.width, footerHeight)
        .fillAndStroke(COLORS.prescription, '#7B1FA2');

      doc
        .fontSize(6)
        .fillColor(COLORS.white)
        .font('Helvetica')
        .text(
          'SIGMAX MEDICAL © 2026 - Ordonnance valide 3 mois',
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
          relativePath: `/uploads/pdfs/prescriptions/${fileName}`
        });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};