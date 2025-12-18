

async function getEnvironmentVersions() {
    const token = process.env.CIRCLECI_TOKEN;
    const projectSlug = process.env.CIRCLECI_PROJECT_SLUG;

    if (!token || !projectSlug) {
        throw new Error('no environment variables');
    }

    const url = `https://circleci.com/api/v2/project/${projectSlug}/pipeline`;

    const response = await fetch(url, {
        headers: {
            'Circle-Token': token,
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`CircleCI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data;
}

module.exports = {
    getEnvironmentVersions
};