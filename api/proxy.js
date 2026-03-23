const https = require('https');

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    const targetPath = req.query.path;
    if (!targetPath) {
        return res.status(400).json({ error: 'Missing path parameter' });
    }

    const targetUrl = 'https://api.omi.me' + targetPath;

    return new Promise((resolve, reject) => {
        const headers = { 'Content-Type': 'application/json' };
        if (req.headers.authorization) {
            headers['Authorization'] = req.headers.authorization;
        }

        const urlObj = new URL(targetUrl);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: req.method,
            headers: headers,
        };

        const proxyReq = https.request(options, (proxyRes) => {
            let body = '';
            proxyRes.on('data', (chunk) => { body += chunk; });
            proxyRes.on('end', () => {
                try {
                    if (proxyRes.statusCode === 204) {
                        res.status(204).end();
                    } else {
                        const data = JSON.parse(body);
                        res.status(proxyRes.statusCode).json(data);
                    }
                } catch (e) {
                    res.status(502).json({ error: 'Parse error', raw: body.substring(0, 200) });
                }
                resolve();
            });
        });

        proxyReq.on('error', (e) => {
            res.status(502).json({ error: 'Proxy error: ' + e.message });
            resolve();
        });

        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            proxyReq.write(JSON.stringify(req.body));
        }
        proxyReq.end();
    });
};
