const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,         
    user: process.env.DB_USER,             
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,       
    waitForConnections: true,
    connectionLimit: 10,       
    queueLimit: 0
});

// Immediately test the connection when this file is loaded
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Successfully connected to the MySQL Database (srms_db).');
        connection.release(); // Always release the connection back to the pool!
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(error.message);
    }
}

// Run the test
testConnection();

// Export the pool so we can use it in app.js and other route files
module.exports = pool;