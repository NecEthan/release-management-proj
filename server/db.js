const { Pool } = require('pg');

console.log('=== DATABASE CONFIGURATION ===');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL preview:', process.env.DATABASE_URL ? 
    process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET');
console.log('==============================');

if (!process.env.DATABASE_URL) {
    console.error('FATAL: DATABASE_URL environment variable is NOT set!');
    console.error('Go to Render Dashboard > Your Service > Environment');
    console.error('Add DATABASE_URL with your Neon connection string');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
});

module.exports = pool;
