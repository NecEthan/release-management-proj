const pool = require('./db');

async function updateEnvironments() {
    try {
        await pool.query('DELETE FROM environments');
        
        await pool.query(`
            INSERT INTO environments (name) VALUES 
            ('Develop'),
            ('Release'),
            ('Release-Candidate'),
            ('Master')
        `);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        pool.end();
    }
}

updateEnvironments();
