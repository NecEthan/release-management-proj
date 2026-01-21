

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const API = {
    async syncCircleCI(currentProject: string) {
        const response = await fetch(`${API_BASE_URL}/circleci/poll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: currentProject })
        });
        if (!response.ok) {
            throw new Error('Failed to sync with CircleCI');
        }
        return response.json();
    },

    async getEnvironments(currentProject: string) {
        const response = await fetch(`${API_BASE_URL}/releases/environments?project=${currentProject}`);
        if (!response.ok) {
            throw new Error('Failed to fetch environments');
        }
        return response.json();
    },

    async getReleases(currentProject: string) {
        const response = await fetch(`${API_BASE_URL}/releases?project=${currentProject}`);
        if (!response.ok) {
            throw new Error('Failed to fetch releases');
        }
        return response.json();
    },

    async getReleaseDetails(id: number, project: string) {
        const response = await fetch(`${API_BASE_URL}/releases/${id}?project=${project}`);
        if (!response.ok) {
            throw new Error('Failed to fetch release details');
        }
        return response.json();
    },

    async getDeployments(currentProject: string) {
        const response = await fetch(`${API_BASE_URL}/deployments?project=${currentProject}`);
        if (!response.ok) {
            throw new Error('Failed to fetch deployments');
        }
        return response.json();
    },

    async getDeploymentDetails(id: number, currentProject: string) {
        const response = await fetch(`${API_BASE_URL}/deployments/${id}?project=${currentProject}`);
        if (!response.ok) {
            throw new Error('Failed to fetch deployment details');
        }
        return response.json();
    },

    async getReleaseStatsLastMonth(currentProject: string) {
        const response = await fetch(`${API_BASE_URL}/releases/stats/last-month?project=${currentProject}`);
        return await response.json();
    },

    async getHotfixes(currentProject: string) {
        const response = await fetch(`${API_BASE_URL}/hotfixes?project=${currentProject}`);
        if (!response.ok) {
            throw new Error('Failed to fetch hotfixes');
        }
        return response.json();
    },

    async getHotfixDetails(id: number, currentProject: string) {
        const response = await fetch(`${API_BASE_URL}/hotfixes/${id}?project=${currentProject}`);
        if (!response.ok) {
            throw new Error('Failed to fetch hotfix details');
        }
        return response.json();
    },

    async login(username: string, password: string) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) {
            throw new Error('Invalid username or password');
        }
        return response.json();
    }
}