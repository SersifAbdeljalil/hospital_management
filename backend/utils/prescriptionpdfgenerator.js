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

// Palette de couleurs SIGMAX MEDICAL (INCHANGÉE)
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
  prescription: '#9C27B0'
};

// Fonction pour générer un "seed" numérique à partir d'un nom
const getNameSeed = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Générateur de nombres pseudo-aléatoires basé sur un seed
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

// Fonction pour dessiner le cachet médical moderne
const drawMedicalStamp = (doc, x, y, doctorName, specialty) => {
  doc
    .strokeColor(COLORS.prescription)
    .lineWidth(2.5)
    .circle(x + 40, y + 30, 38)
    .stroke();

  doc
    .strokeColor(COLORS.prescription)
    .lineWidth(1)
    .circle(x + 40, y + 30, 34)
    .stroke();

  doc
    .fontSize(7.5)
    .fillColor(COLORS.prescription)
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
    .fillColor(COLORS.prescription)
    .text('+', x + 36, y + 45, { width: 8, align: 'center' });

  doc
    .fontSize(5)
    .font('Helvetica')
    .text('Rabat, Maroc', x + 8, y + 54, { width: 64, align: 'center' });
};

// ⭐⭐⭐ SIGNATURE UNIQUE BASÉE SUR LE NOM ⭐⭐⭐
const drawUniqueSignature = (doc, x, y, fullName, color) => {
  doc.save();
  
  const seed = getNameSeed(fullName);
  const rng = new SeededRandom(seed);
  
  doc
    .strokeColor(color)
    .lineWidth(1.5 + rng.range(0, 0.5));

  // Nombre de segments basé sur la longueur du nom
  const segments = Math.min(fullName.length, 8);
  
  let currentX = x;
  let currentY = y + 10;
  
  // Première lettre - style unique
  const firstLetterStyle = rng.range(0, 3);
  
  if (firstLetterStyle < 1) {
    // Style 1: Boucle haute
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
    // Style 2: Trait descendant
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
    // Style 3: Zigzag
    doc
      .moveTo(currentX, currentY)
      .lineTo(currentX + 8, currentY - 5)
      .lineTo(currentX + 16, currentY + 2)
      .lineTo(currentX + 20, currentY + 10)
      .stroke();
  }
  
  currentX += 22;
  
  // Corps de la signature - variations uniques
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
  
  // Finition - flourish unique
  const flourishStyle = rng.range(0, 3);
  
  if (flourishStyle < 1) {
    // Boucle finale
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
    // Point final
    doc
      .circle(currentX + 5, currentY, 1.5)
      .fill();
  } else {
    // Trait descendant
    doc
      .moveTo(currentX, currentY)
      .bezierCurveTo(
        currentX + 5, currentY + 5,
        currentX + 8, currentY + 10,
        currentX + 6, currentY + 15
      )
      .stroke();
  }
  
  // Trait de soulignement unique
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

  // Nom imprimé sous la signature
  doc
    .fontSize(8)
    .fillColor(color)
    .font('Helvetica-Bold')
    .text(fullName, x - 10, y + 28, { width: 120, align: 'center' });
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

      const maxPageHeight = 842;
      const footerHeight = 18;
      const maxContentHeight = maxPageHeight - footerHeight - 30;

      // ==================== EN-TÊTE ====================
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
        .fillColor(COLORS.prescription)
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
        .rect(50, currentY, 495, 28)
        .fillAndStroke(COLORS.prescription, '#7B1FA2');

      doc
        .fontSize(14)
        .fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .text('ORDONNANCE MEDICALE', 50, currentY + 7, { 
          width: 495, 
          align: 'center' 
        });

      currentY += 34;

      const dateCreation = new Date(prescriptionData.date_creation || prescriptionData.created_at);
      doc
        .fontSize(6)
        .fillColor(COLORS.textMuted)
        .font('Helvetica')
        .text(
          `No ${prescriptionData.numero_ordonnance} | Date: ${dateCreation.toLocaleDateString('fr-FR')} a ${dateCreation.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 
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
        .text('Specialite:', 320, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(prescriptionData.specialite || 'Medecine generale', 320, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Telephone:', 60, currentY + 27)
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
        .text('No Dossier:', 320, currentY + 6)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(prescriptionData.numero_dossier, 320, currentY + 15);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Age/Sexe:', 60, currentY + 27)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(`${patientAge} ans / ${prescriptionData.patient_sexe || 'N/A'}`, 110, currentY + 27);

      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Telephone:', 320, currentY + 27)
        .font('Helvetica')
        .fillColor(COLORS.textPrimary)
        .text(prescriptionData.patient_telephone || 'N/A', 380, currentY + 27);

      currentY += 48;

      // ==================== DIAGNOSTIC ====================
      if (prescriptionData.diagnostic) {
        currentY = drawSection(doc, 'DIAGNOSTIC', currentY, COLORS.primary);

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
      currentY = drawSection(doc, 'PRESCRIPTION MEDICAMENTEUSE', currentY, COLORS.danger);

      const medicaments = prescriptionData.medicaments || [];
      
      if (medicaments.length > 0) {
        medicaments.forEach((med, index) => {
          if (currentY > maxContentHeight - 100) {
            doc.addPage();
            currentY = 50;
          }

          drawInfoBox(doc, 50, currentY, 495, 50, '#FFFFFF');

          doc
            .fontSize(10)
            .fillColor(COLORS.white)
            .rect(55, currentY + 5, 24, 24)
            .fillAndStroke(COLORS.prescription, '#7B1FA2')
            .fontSize(10)
            .fillColor(COLORS.white)
            .font('Helvetica-Bold')
            .text(`${index + 1}`, 55, currentY + 11, { width: 24, align: 'center' });

          doc
            .fontSize(9)
            .fillColor(COLORS.textPrimary)
            .font('Helvetica-Bold')
            .text(med.nom || med.name, 85, currentY + 8, { width: 450 });

          doc
            .fontSize(7)
            .fillColor(COLORS.textSecondary)
            .font('Helvetica')
            .text(
              `${med.dosage || 'N/A'} - ${med.forme || 'comprimes'}`, 
              85, 
              currentY + 20
            );

          doc
            .fontSize(7)
            .fillColor(COLORS.textPrimary)
            .font('Helvetica-Bold')
            .text('Posologie:', 85, currentY + 30)
            .font('Helvetica')
            .text(med.posologie || 'Selon avis medical', 130, currentY + 30);

          if (med.duree) {
            doc
              .fontSize(7)
              .fillColor(COLORS.textPrimary)
              .font('Helvetica-Bold')
              .text('Duree:', 380, currentY + 30)
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
          .text('Aucun medicament prescrit', 60, currentY + 6);
        
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
          .text('Duree totale du traitement:', 60, currentY + 8)
          .font('Helvetica')
          .fillColor(COLORS.success)
          .fontSize(8)
          .text(prescriptionData.duree_traitement, 180, currentY + 8);

        currentY += 30;
      }

      // ==================== PAIEMENT ====================
      if (prescriptionData.paiement_statut === 'payee' && prescriptionData.montant_total) {
        if (currentY > maxContentHeight - 80) {
          doc.addPage();
          currentY = 50;
        }

        currentY = drawSection(doc, 'INFORMATIONS DE PAIEMENT', currentY, COLORS.success);

        drawInfoBox(doc, 50, currentY, 495, 45, '#E8F5E9');

        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .fillColor(COLORS.textSecondary)
          .text('Montant paye:', 60, currentY + 8)
          .font('Helvetica')
          .fillColor(COLORS.success)
          .fontSize(9)
          .text(`${prescriptionData.montant_total} MAD`, 130, currentY + 7);

        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .fillColor(COLORS.textSecondary)
          .text('Date de paiement:', 320, currentY + 8)
          .font('Helvetica')
          .fillColor(COLORS.textPrimary)
          .text(
            prescriptionData.date_paiement 
              ? new Date(prescriptionData.date_paiement).toLocaleDateString('fr-FR')
              : 'N/A',
            420,
            currentY + 8
          );

        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .fillColor(COLORS.textSecondary)
          .text('Mode de paiement:', 60, currentY + 24)
          .font('Helvetica')
          .fillColor(COLORS.textPrimary)
          .text(prescriptionData.methode_paiement || 'En ligne', 150, currentY + 24);

        doc
          .fontSize(7)
          .font('Helvetica-Bold')
          .fillColor(COLORS.textSecondary)
          .text('Statut:', 320, currentY + 24)
          .font('Helvetica')
          .fillColor(COLORS.success)
          .text('PAYEE', 360, currentY + 24);

        currentY += 52;
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
        .text('IMPORTANT', 60, currentY + 6)
        .font('Helvetica')
        .text(
          'Ne pas depasser la dose prescrite. Conserver hors de portee des enfants. En cas d\'effets indesirables, consulter immediatement votre medecin.',
          60,
          currentY + 15,
          { width: 475, align: 'justify' }
        );

      currentY += 38;

      // ==================== SIGNATURES UNIQUES ====================
      if (currentY > maxContentHeight - 120) {
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
        .text('SIGNATURES ET CACHETS', 50, currentY, { align: 'center' });

      currentY += 16;

      const signBoxWidth = 230;
      const signBoxHeight = 90;
      const spacing = 15;

      // ⭐ Signature Patient UNIQUE
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

      if (prescriptionData.paiement_statut === 'payee') {
        const patientFullName = `${prescriptionData.patient_prenom} ${prescriptionData.patient_nom}`;
        drawUniqueSignature(
          doc,
          90,
          currentY + 18,
          patientFullName,
          COLORS.success
        );

        doc
          .fontSize(6)
          .fillColor(COLORS.textPrimary)
          .font('Helvetica')
          .text(
            `Signe le: ${prescriptionData.date_paiement ? new Date(prescriptionData.date_paiement).toLocaleDateString('fr-FR') : '___/___/______'}`,
            58,
            currentY + signBoxHeight - 12
          );
      } else {
        doc
          .fontSize(6)
          .fillColor(COLORS.textMuted)
          .text('Date: ___/___/______', 58, currentY + signBoxHeight - 12);
      }

      // ⭐ Signature Médecin UNIQUE
      const doctorBoxX = 50 + signBoxWidth + spacing;
      doc
        .strokeColor(COLORS.prescription)
        .lineWidth(1.5)
        .rect(doctorBoxX, currentY, signBoxWidth, signBoxHeight)
        .stroke();

      doc
        .fontSize(7)
        .font('Helvetica-Bold')
        .fillColor(COLORS.textSecondary)
        .text('Signature et Cachet du Medecin', doctorBoxX + 8, currentY + 6);

      const doctorFullName = `Dr. ${prescriptionData.medecin_prenom} ${prescriptionData.medecin_nom}`;
      drawUniqueSignature(doc, doctorBoxX + 15, currentY + 18, doctorFullName, COLORS.prescription);

      drawMedicalStamp(
        doc,
        doctorBoxX + 135,
        currentY + 2,
        `${prescriptionData.medecin_prenom} ${prescriptionData.medecin_nom}`,
        prescriptionData.specialite || 'Medecine generale'
      );

      doc
        .fontSize(6)
        .fillColor(COLORS.textPrimary)
        .font('Helvetica')
        .text(
          `Signe le: ${dateCreation.toLocaleDateString('fr-FR')}`,
          doctorBoxX + 8,
          currentY + signBoxHeight - 12
        );

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
          `SIGMAX MEDICAL (c) ${new Date().getFullYear()} - Ordonnance valide 3 mois - Document authentifie`,
          0,
          footerY + 6,
          { width: doc.page.width, align: 'center' }
        );

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