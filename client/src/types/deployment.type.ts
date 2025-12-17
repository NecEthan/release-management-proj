export interface Deployment {
    id: number;
    deployed_at: string;
    branch: string;
    commit_sha: string;
    environment: string;
    release_version: string;
    environment_id?: number;
    release_id?: number;
    release_status?: string;
    release_date?: string;
    deployed_by?: string;
    jiraTickets?: JiraTicket[];
    pullRequests?: PullRequest[];
}

export interface JiraTicket {
    id: number;
    jira_key: string;
    summary: string;
    url: string;
    status: string;
}

export interface PullRequest {
    id: number;
    pr_number: number;
    title: string;
    url: string;
    author: string;
}
