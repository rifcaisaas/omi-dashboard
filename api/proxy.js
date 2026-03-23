export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Extract path: /api/proxy?path=/v1/dev/user/conversations
    const targetPath = req.query.path;
    if (!targetPath) {
        return res.status(400).json({ error: 'Missing path parameter' });
    }

    const targetUrl = 'https://api.omi.me' + targetPath;

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }

        const fetchOptions = {
            method: req.method,
            headers,
        };

        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);

        if (response.status === 204) {
            return res.status(204).end();
        }

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        return res.status(502).json({ error: 'Proxy error: ' + error.message });
    }
}
