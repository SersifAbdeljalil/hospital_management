const mysql = require('mysql2');
require('dotenv').config();

// Créer le pool avec mysql2 (PAS mysql2/promise)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+00:00'
});

const promisePool = pool.promise();

// Test de connexion
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Connexion à MySQL réussie!');
        console.log(`📊 Base de données: ${process.env.DB_NAME}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion à MySQL:', error.message);
        return false;
    }
};

// Fonction helper - VERSION SIMPLE ET ROBUSTE
const query = async (sql, params = []) => {
    try {
        const [results] = await promisePool.query(sql, params);
        return results;
    } catch (error) {
        console.error('❌ Erreur SQL:', error.message);
        throw error;
    }
};

module.exports = { pool, promisePool, testConnection, query };