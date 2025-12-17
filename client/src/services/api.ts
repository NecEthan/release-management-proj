

const API_BASE_URL = 'http://localhost:5000/api';

export const API = {
    async syncCircleCI() {
        const response = await fetch(`${API_BASE_URL}/circleci/poll`);
        if (!response.ok) {
            throw new Error('Failed to sync with CircleCI');
        }
        return response.json();
    },

    async getEnvironments() {
        const response = await fetch(`${API_BASE_URL}/releases/environments`);
        if (!response.ok) {
            throw new Error('Failed to fetch environments');
        }
        return response.json();
    },

    async getReleases() {
        const response = await fetch(`${API_BASE_URL}/releases`);
        if (!response.ok) {
            throw new Error('Failed to fetch releases');
        }
        return response.json();
    },

    async getReleaseDetails(id: number) {
        const response = await fetch(`${API_BASE_URL}/releases/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch release details');
        }
        return response.json();
    }
}