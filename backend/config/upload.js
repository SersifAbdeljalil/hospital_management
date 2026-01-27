const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'documents';
        
        if (file.fieldname === 'prescription') {
            folder = 'prescriptions';
        } else if (file.fieldname === 'report') {
            folder = 'reports';
        }
        
        cb(null, path.join(__dirname, '../uploads', folder));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtre des fichiers acceptés
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Formats acceptés: JPEG, PNG, PDF, DOC, DOCX'));
    }
};

// Configuration de multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB par défaut
    },
    fileFilter: fileFilter
});

module.exports = upload;