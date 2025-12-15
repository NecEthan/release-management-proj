const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migrations', 'create_all_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
    } catch (error) {
        console.error('❌ Migration error:', error.message);
    } finally {
        pool.end();
    }
}

runMigration();
