DROP TABLE IF EXISTS deployments CASCADE;
DROP TABLE IF EXISTS hotfixes CASCADE;
DROP TABLE IF EXISTS pull_requests CASCADE;
DROP TABLE IF EXISTS jira_tickets CASCADE;
DROP TABLE IF EXISTS commits CASCADE;
DROP TABLE IF EXISTS releases CASCADE;

UPDATE environments SET current_version = NULL, last_deployed_at = NULL;

CREATE TABLE IF NOT EXISTS releases (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    release_date TIMESTAMP,
    status VARCHAR(50),
    environment_id INT REFERENCES environments(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commits (
    id SERIAL PRIMARY KEY,
    commit_hash VARCHAR(100) NOT NULL,
    message TEXT,
    author VARCHAR(100),
    url VARCHAR(500),
    committed_at TIMESTAMP,
    release_id INT REFERENCES releases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pull_requests (
    id SERIAL PRIMARY KEY,
    pr_number INT NOT NULL,
    title VARCHAR(500),
    url VARCHAR(500),
    author VARCHAR(100),
    merged_at TIMESTAMP,
    release_id INT REFERENCES releases(id) ON DELETE CASCADE,
    UNIQUE(pr_number, release_id)
);

CREATE TABLE IF NOT EXISTS jira_tickets (
    id SERIAL PRIMARY KEY,
    jira_key VARCHAR(50) NOT NULL,
    summary TEXT,
    url VARCHAR(500),
    status VARCHAR(50),
    release_id INT REFERENCES releases(id) ON DELETE CASCADE,
    UNIQUE(jira_key, release_id)
);

CREATE TABLE IF NOT EXISTS hotfixes (
    id SERIAL PRIMARY KEY,
    release_id INT REFERENCES releases(id) ON DELETE CASCADE,
    title VARCHAR(500),
    description TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployments (
    id SERIAL PRIMARY KEY,
    environment_id INT REFERENCES environments(id),
    release_id INT REFERENCES releases(id),
    deployed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deployed_by VARCHAR(100),
    branch VARCHAR(100),
    commit_sha VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_releases_version ON releases(version);
CREATE INDEX IF NOT EXISTS idx_releases_environment ON releases(environment_id);
CREATE INDEX IF NOT EXISTS idx_commits_release ON commits(release_id);
CREATE INDEX IF NOT EXISTS idx_commits_hash ON commits(commit_hash);
CREATE INDEX IF NOT EXISTS idx_prs_release ON pull_requests(release_id);
CREATE INDEX IF NOT EXISTS idx_jira_release ON jira_tickets(release_id);
CREATE INDEX IF NOT EXISTS idx_jira_key ON jira_tickets(jira_key);
CREATE INDEX IF NOT EXISTS idx_hotfixes_release ON hotfixes(release_id);
CREATE INDEX IF NOT EXISTS idx_deployments_environment ON deployments(environment_id);
CREATE INDEX IF NOT EXISTS idx_deployments_release ON deployments(release_id);