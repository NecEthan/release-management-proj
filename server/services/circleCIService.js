

async function getEnvironmentVersions(project = 'YOT') {
    const token = process.env.CIRCLECI_TOKEN;
    const projectSlug = project === 'pathways-ui' 
        ? process.env.CIRCLECI_PROJECT_SLUG_PATHWAYS_UI 
        : process.env.CIRCLECI_PROJECT_SLUG_YOT;

    if (!token || !projectSlug) {
        throw new Error(`Missing environment variables for project: ${project}`);
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