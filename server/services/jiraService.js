async function getJiraTicketsForRelease(version, project = 'YOT') {
    const apiKey = process.env.JIRA_API_KEY;
    const baseUrl = process.env.JIRA_BASE_URL;
    const email = process.env.JIRA_EMAIL;
    const jiraTicketBaseUrl = `${baseUrl}/browse`;

    const jiraProject = project === 'pathways-ui' ? 'IDV' : 'PP';
    const projectSuffix = project === 'pathways-ui' ? ' (MM)' : ' (YOT)';
    const jql = `project = ${jiraProject} AND (fixVersion = "${version}" OR fixVersion = "${version}${projectSuffix}") order by created DESC`;
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
    
    const releaseBranch = `${version}_release_branch`;
    const allPRs = await getPRsForReleaseBranch(releaseBranch, project);
    
    const ticketsWithPRs = [];
    for (const issue of data.issues || []) {
        const ticketPRs = allPRs.filter(pr => {
            const prText = `${pr.title} ${pr.body || ''}`;
            return prText.includes(issue.key);
        });
        
        ticketsWithPRs.push({
            key: issue.key,
            url: `${jiraTicketBaseUrl}/${issue.key}`,
            summary: issue.fields.summary,
            status: issue.fields.status.name,
            priority: issue.fields.priority?.name || 'None',
            assignee: issue.fields.assignee?.displayName || 'Unassigned',
            created: issue.fields.created,
            updated: issue.fields.updated,
            pullRequests: ticketPRs
        });
    }

    return { tickets: ticketsWithPRs, total: ticketsWithPRs.length };
}

async function getPRsForReleaseBranch(branchName, project = 'YOT') {
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOrg = process.env.GITHUB_ORG;
    const githubRepo = project === 'pathways-ui' 
        ? process.env.GITHUB_REPO_PATHWAYS_UI 
        : process.env.GITHUB_REPO_YOT;

    if (!githubToken || !githubOrg || !githubRepo) {
        throw new Error('GitHub configuration missing: GITHUB_TOKEN, GITHUB_ORG, or GITHUB_REPO not set');
    }

    const branchFormats = [
        branchName.replace('_release_branch', '-release-branch'),
        branchName.replace('_release_branch', '-Release-Branch')  
    ];
    
    let allPRs = [];
    
    for (const branch of branchFormats) {
        const searchUrl = `https://api.github.com/search/issues?q=base:${encodeURIComponent(branch)}+repo:${githubOrg}/${githubRepo}+type:pr+is:merged&per_page=100`;
        
        const response = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            continue;
        }

        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const prs = data.items.map(pr => ({
                number: pr.number,
                title: pr.title,
                url: pr.html_url,
                state: pr.state,
                author: pr.user.login,
                body: pr.body || ''
            }));
            allPRs = allPRs.concat(prs);
        }
    }
    
    const uniquePRs = Array.from(new Map(allPRs.map(pr => [pr.number, pr])).values());
    
    return uniquePRs;
}

module.exports = {
    getJiraTicketsForRelease,
};