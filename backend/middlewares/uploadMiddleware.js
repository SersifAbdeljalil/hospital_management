const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Chemin du dossier d'upload
const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Dossier uploads/profiles créé');
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);

    // Sécuriser req.user
    const userId = req.user && req.user.id ? req.user.id : 'anonymous';

    cb(null, `user_${userId}_${uniqueSuffix}${ext}`);
  }
});

// Filtre des types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images (JPEG, JPG, PNG, GIF) sont autorisées'));
  }
};

// Configuration multer
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter
});

// Export CORRECT
module.exports = upload;
