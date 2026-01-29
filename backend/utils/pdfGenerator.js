const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const pdfDir = path.join(__dirname, '../uploads/pdfs');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

const logoPath = path.join(__dirname, 'image.png');

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

// Fonction seed et générateur aléatoire
const getNameSeed = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

class SeededRandom {
  constructor(seed) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  range(min, max) {
    return min + this.next() * (max - min);
  }
}

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

const drawMedicalStamp = (doc, x, y, doctorName, specialty) => {
  doc
    .strokeColor(COLORS.primary)
    .lineWidth(2.5)
    .circle(x + 40, y + 30, 38)
    .stroke();

  doc
    .strokeColor(COLORS.primary)
    .lineWidth(1)
    .circle(x + 40, y + 30, 34)
    .stroke();

  doc
    .fontSize(7.5)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text('SIGMAX MEDICAL', x + 8, y + 14, { width: 64, align: 'center' });

  doc
    .fontSize(6.5)
    .font('Helvetica-Bold')
    .text(doctorName, x + 4, y + 26, { width: 72, align: 'center' });

  doc
    .fontSize(5.5)
    .font('Helvetica')
    .text(specialty, x + 4, y + 36, { width: 72, align: 'center' });

  doc
    .fontSize(10)
    .fillColor(COLORS.primary)
    .text('+', x + 36, y + 45, { width: 8, align: 'center' });

  doc
    .fontSize(5)
    .font('Helvetica')
    .text('Rabat, Maroc', x + 8, y + 54, { width: 64, align: 'center' });
};

// ⭐ Signature unique
const drawUniqueSignature = (doc, x, y, fullName, color) => {
  doc.save();
  
  const seed = getNameSeed(fullName);
  const rng = new SeededRandom(seed);
  
  doc
    .strokeColor(color)
    .lineWidth(1.5 + rng.range(0, 0.5));

  const segments = Math.min(fullName.length, 8);
  
  let currentX = x;
  let currentY = y + 10;
  
  const firstLetterStyle = rng.range(0, 3);
  
  if (firstLetterStyle < 1) {
    doc
      .moveTo(currentX, currentY)
      .bezierCurveTo(
        currentX + 5, currentY - 8 - rng.range(0, 3),
        currentX + 15, currentY - 5 - rng.range(0, 2),
        currentX + 20, currentY + 2
      )
      .bezierCurveTo(
        currentX + 22, currentY + 8,
        currentX + 18, currentY + 15,
        currentX + 12, currentY + 12
      )
      .stroke();
  } else if (firstLetterStyle < 2) {
    doc
      .moveTo(currentX, currentY - 5)
      .bezierCurveTo(
        currentX + 8, currentY - 3,
        currentX + 12, currentY + 5,
        currentX + 18, currentY + 8
      )
      .bezierCurveTo(
        currentX + 20, currentY + 12,
        currentX + 16, currentY + 16,
        currentX + 10, currentY + 14
      )
      .stroke();
  } else {
    doc
      .moveTo(currentX, currentY)
      .lineTo(currentX + 8, currentY - 5)
      .lineTo(currentX + 16, currentY + 2)
      .lineTo(currentX + 20, currentY + 10)
      .stroke();
  }
  
  currentX += 22;
  
  for (let i = 0; i < segments; i++) {
    const amplitude = 3 + rng.range(-2, 4);
    const frequency = 15 + rng.range(-5, 10);
    const yVariation = rng.range(-3, 3);
    
    const cp1x = currentX + frequency * 0.3;
    const cp1y = currentY + amplitude + yVariation;
    const cp2x = currentX + frequency * 0.7;
    const cp2y = currentY - amplitude + yVariation;
    const endX = currentX + frequency;
    const endY = currentY + rng.range(-2, 2);
    
    doc
      .moveTo(currentX, currentY)
      .bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY)
      .stroke();
    
    currentX = endX;
    currentY = endY;
  }
  
  const flourishStyle = rng.range(0, 3);
  
  if (flourishStyle < 1) {
    doc
      .moveTo(currentX, currentY)
      .bezierCurveTo(
        currentX + 10, currentY - 5,
        currentX + 15, currentY + 2,
        currentX + 12, currentY + 8
      )
      .bezierCurveTo(
        currentX + 10, currentY + 12,
        currentX + 5, currentY + 10,
        currentX + 2, currentY + 6
      )
      .stroke();
  } else if (flourishStyle < 2) {
    doc
      .circle(currentX + 5, currentY, 1.5)
      .fill();
  } else {
    doc
      .moveTo(currentX, currentY)
      .bezierCurveTo(
        currentX + 5, currentY + 5,
        currentX + 8, currentY + 10,
        currentX + 6, currentY + 15
      )
      .stroke();
  }
  
  const underlineY = y + 22;
  const underlineVariation = rng.range(-2, 2);
  
  doc
    .lineWidth(0.7 + rng.range(0, 0.3))
    .moveTo(x - 5, underlineY + underlineVariation)
    .bezierCurveTo(
      x + 30, underlineY + rng.range(-1, 2),
      x + 60, underlineY + rng.range(-2, 1),
      x + 100, underlineY + rng.range(-1, 2)
    )
    .stroke();

  doc.restore();

  doc
    .fontSize(8)
    .fillColor(color)
    .font('Helvetica-Bold')
    .text(fullName, x - 10, y + 28, { width: 120, align: 'center' });
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

      const maxPageHeight = 842;
      const footerHeight = 18;
      const maxContentHeight = maxPageHeight - footerHeight - 30;

      let currentY = 30;

      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, currentY, { width: 45, height: 45 });
        } catch (error) {
          console.log('Logo non charge:', error.message);
        }
      }

      doc
        .fontSize(13)
        .fillColor(COLORS.primary)
        .font('Helvetica-Bold')
        .text('SIGMAX MEDICAL', 400, currentY, { align: 'right' });

      doc
        .fontSize(6.5)
        .fillColor(COLORS.textSecondary)
        .font('Helvetica')
        .text('Centre Medical Avance', 400, currentY + 16, { align: 'right' })
        .text('Avenue Hassan II, Rabat', 400, currentY + 25, { align: 'right' })
        .text('Tel: +212 500-022233', 400, currentY + 34, { align: 'right' })
        .text('contact@sigmaxmedical.ma', 400, currentY + 43, { align: 'right' });

      currentY = 90;

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

      doc
        .fontSize(6)
        .fillColor(COLORS.textMuted)
        .font('Helvetica')
        .text(`No RDV: ${appointmentData.id} | Genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')}`, 
          50, currentY, { align: 'center' });

      currentY += 12;

      currentY = drawSection(doc, 'DETAILS DU RENDEZ-VOUS', currentY, COLORS.primary);

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
        .text('Duree:', 60, currentY + 30)
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

      currentY = drawSection(doc, 'INFORMATIONS PATIENT', currentY, COLORS.secondary);

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
        .text('No Dossier:', 320, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(appointmentData.numero_dossier, 320, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Telephone:', 60, currentY + 27)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(appointmentData.patient_telephone || 'N/A', 110, currentY + 27);

      currentY += 50;

      currentY = drawSection(doc, 'PRATICIEN', currentY, COLORS.secondary);

      drawInfoBox(doc, 50, currentY, 495, 32);

      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Medecin:', 60, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(`Dr. ${appointmentData.medecin_nom} ${appointmentData.medecin_prenom}`, 60, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Specialite:', 320, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(appointmentData.specialite || 'Medecine generale', 320, currentY + 15);

      currentY += 42;

      if (appointmentData.motif && currentY < maxContentHeight - 200) {
        currentY = drawSection(doc, 'MOTIF', currentY, COLORS.accent);

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

      currentY = drawSection(doc, 'INSTRUCTIONS', currentY, COLORS.accent);

      doc
        .fontSize(6)
        .font('Helvetica')
        .fillColor(COLORS.textSecondary)
        .text('- Arrivez 10 minutes avant l\'heure', 60, currentY)
        .text('- Prevenez 24h a l\'avance en cas d\'empechement', 60, currentY + 8)
        .text('- Apportez votre carte CNSS/CNOPS et piece d\'identite', 60, currentY + 16);

      currentY += 30;

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
        .text('SIGNATURES ET CACHETS', 50, currentY, { align: 'center' });

      currentY += 16;

      const signBoxWidth = 230;
      const signBoxHeight = 90;
      const spacing = 15;

      // Signature Patient (vide)
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
        .text('(Lu et approuve)', 58, currentY + 16);

      doc
        .fontSize(6)
        .fillColor(COLORS.textMuted)
        .text('Date: ___/___/______', 58, currentY + signBoxHeight - 12);

      // ⭐ Signature Médecin UNIQUE
      const doctorBoxX = 50 + signBoxWidth + spacing;
      doc
        .strokeColor(COLORS.primary)
        .lineWidth(1.5)
        .rect(doctorBoxX, currentY, signBoxWidth, signBoxHeight)
        .stroke();

      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Signature et Cachet du Medecin', doctorBoxX + 8, currentY + 6);

      const doctorFullName = `Dr. ${appointmentData.medecin_prenom} ${appointmentData.medecin_nom}`;
      drawUniqueSignature(doc, doctorBoxX + 15, currentY + 18, doctorFullName, COLORS.primary);

      drawMedicalStamp(
        doc,
        doctorBoxX + 135,
        currentY + 2,
        `${appointmentData.medecin_prenom} ${appointmentData.medecin_nom}`,
        appointmentData.specialite || 'Medecine generale'
      );

      doc
        .fontSize(6)
        .fillColor(COLORS.textPrimary)
        .font('Helvetica')
        .text(
          `Signe le: ${new Date().toLocaleDateString('fr-FR')}`,
          doctorBoxX + 8,
          currentY + signBoxHeight - 12
        );

      currentY += signBoxHeight + 8;

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
          'Document confidentiel. Toute divulgation non autorisee est interdite.',
          50,
          currentY,
          { width: 495, align: 'center' }
        );

      const footerY = maxPageHeight - footerHeight;
      doc
        .rect(0, footerY, doc.page.width, footerHeight)
        .fillAndStroke(COLORS.primary, COLORS.primaryDark);

      doc
        .fontSize(6)
        .fillColor(COLORS.white)
        .font('Helvetica')
        .text(
          `SIGMAX MEDICAL (c) ${new Date().getFullYear()} - Systeme d\'Information Hospitalier`,
          0,
          footerY + 6,
          { width: doc.page.width, align: 'center' }
        );

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