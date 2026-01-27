require('dotenv').config();

module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'default_secret_change_me',
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    bcryptSaltRounds: 10,
    
    // Rôles disponibles
    roles: {
        ADMIN: 'admin',
        MEDECIN: 'medecin',
        INFIRMIER: 'infirmier',
        RECEPTIONNISTE: 'receptionniste',
        PATIENT: 'patient'
    },
    
    // Permissions par rôle
    permissions: {
        admin: ['all'],
        medecin: ['read_patients', 'write_patients', 'read_consultations', 'write_consultations', 'read_prescriptions', 'write_prescriptions'],
        infirmier: ['read_patients', 'read_consultations', 'write_vital_signs'],
        receptionniste: ['read_patients', 'write_patients', 'read_appointments', 'write_appointments', 'read_billing', 'write_billing'],
        patient: ['read_own_data']
    }
};