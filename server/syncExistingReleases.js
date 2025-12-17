require('dotenv').config();
const jiraService = require('./services/jiraService');
const pool = require('./db');

async function syncExistingReleases() {
    try {
        const releasesResult = await pool.query(
            `SELECT r.id, r.version, 
                    COUNT(DISTINCT jt.id) as ticket_count
             FROM releases r
             LEFT JOIN jira_tickets jt ON r.id = jt.release_id
             GROUP BY r.id, r.version
             ORDER BY r.created_at DESC`
        );
        
        for (const release of releasesResult.rows) {
            console.log(`\n📦 Release: ${release.version} (ID: ${release.id})`);
            console.log(`   Current tickets: ${release.ticket_count}`);
            
            if (release.ticket_count > 0) {
                console.log('   ⏭️  Already has tickets, skipping...');
                continue;
            }
            
            try {
                const { tickets } = await jiraService.getJiraTicketsForRelease(release.version);
                
                let ticketCount = 0;
                let prCount = 0;
                
                for (const ticket of tickets) {
                    const result = await pool.query(
                        `INSERT INTO jira_tickets (jira_key, summary, url, status, release_id)
                         VALUES ($1, $2, $3, $4, $5)
                         ON CONFLICT DO NOTHING
                         RETURNING id`,
                        [ticket.key, ticket.summary, ticket.url, ticket.status, release.id]
                    );
                    
                    if (result.rows.length > 0) {
                        ticketCount++;
                        console.log(`      - ${ticket.key}: ${ticket.summary}`);
                    }
                    
                    for (const pr of ticket.pullRequests) {
                        const prResult = await pool.query(
                            `INSERT INTO pull_requests (pr_number, title, url, author, release_id)
                             VALUES ($1, $2, $3, $4, $5)
                             ON CONFLICT DO NOTHING
                             RETURNING id`,
                            [pr.number, pr.title, pr.url, pr.author, release.id]
                        );
                        
                        if (prResult.rows.length > 0) {
                            prCount++;
                        }
                    }
                }
                
                
            } catch (error) {
                console.error(`Failed to fetch Jira tickets: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('Error syncing releases:', error);
    } finally {
        process.exit();
    }
}

syncExistingReleases();
