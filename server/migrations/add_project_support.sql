-- Add project column to all tables
ALTER TABLE releases ADD COLUMN IF NOT EXISTS project VARCHAR(50) DEFAULT 'YOT';
ALTER TABLE jira_tickets ADD COLUMN IF NOT EXISTS project VARCHAR(50) DEFAULT 'YOT';
ALTER TABLE pull_requests ADD COLUMN IF NOT EXISTS project VARCHAR(50) DEFAULT 'YOT';
ALTER TABLE hotfixes ADD COLUMN IF NOT EXISTS project VARCHAR(50) DEFAULT 'YOT';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_releases_project ON releases(project);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_project ON jira_tickets(project);
CREATE INDEX IF NOT EXISTS idx_pull_requests_project ON pull_requests(project);
CREATE INDEX IF NOT EXISTS idx_hotfixes_project ON hotfixes(project);

-- Update unique constraints to include project
ALTER TABLE jira_tickets DROP CONSTRAINT IF EXISTS jira_tickets_jira_key_release_id_key;
ALTER TABLE jira_tickets ADD CONSTRAINT jira_tickets_jira_key_release_id_project_key 
    UNIQUE (jira_key, release_id, project);

ALTER TABLE pull_requests DROP CONSTRAINT IF EXISTS pull_requests_pr_number_release_id_key;
ALTER TABLE pull_requests ADD CONSTRAINT pull_requests_pr_number_release_id_project_key 
    UNIQUE (pr_number, release_id, project);