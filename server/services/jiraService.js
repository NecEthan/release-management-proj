async function getJiraTicketsForRelease(version) {
    const apiKey = process.env.JIRA_API_KEY;
    const baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const jiraTicketBaseUrl = `${baseUrl}/browse`;

    const jql = `project = PP AND fixVersion = "${version}" order by created DESC`;
    const fields = 'summary,status,priority,assignee,created,updated';
    const url = `${baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=50`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching Jira tickets: ${response.statusText}`);
    }

    const data = await response.json();
    
    const ticketsWithPRs = await Promise.all(
        data.issues.map(async (issue) => {
            const pullRequests = await getGitHubCommitsForTicket(issue.key);

            return {
                key: issue.key,
                url: `${jiraTicketBaseUrl}/${issue.key}`,
                summary: issue.fields.summary,
                status: issue.fields.status.name,
                priority: issue.fields.priority?.name || 'None',
                assignee: issue.fields.assignee?.displayName || 'Unassigned',
                created: issue.fields.created,
                updated: issue.fields.updated,
                pullRequests: pullRequests
            };
        })
    );

    return { tickets: ticketsWithPRs, total: ticketsWithPRs.length };
}

async function getGitHubCommitsForTicket(ticketKey) {
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOrg = process.env.GITHUB_ORG;
    const githubRepo = process.env.GITHUB_REPO;

    if (!githubToken || !githubOrg || !githubRepo) {
        throw new Error('GitHub configuration missing: GITHUB_TOKEN, GITHUB_ORG, or GITHUB_REPO not set');
    }

    const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(ticketKey)}+repo:${githubOrg}/${githubRepo}+type:pr`;
    
    const response = await fetch(searchUrl, {
        headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.items.map(pr => ({
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        state: pr.state,
        author: pr.user.login
    }));
}

module.exports = {
    getJiraTicketsForRelease,
};