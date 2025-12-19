

async function getEnvironmentVersions() {
    const token = process.env.CIRCLECI_TOKEN;
    const projectSlugYot = process.env.CIRCLECI_PROJECT_SLUG_YOT;

    if (!token || !projectSlugYot) {
        throw new Error('no environment variables');
    }

    const url = `https://circleci.com/api/v2/project/${projectSlugYot}/pipeline`;
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