

const originalFetch = window.fetch;

window.fetch = function(...args) {
    let [resource, config] = args;

    const token = localStorage.getItem('token');

    if (token && resource.toString().includes('/api/')) {
        config = config || {};

        config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    return originalFetch(resource, config);
}