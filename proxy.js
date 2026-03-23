const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8765;
const OMI_API = 'https://api.omi.me';

const MIME = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    // CORS headers for all responses
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Proxy API requests
    if (req.url.startsWith('/api/')) {
        const targetPath = req.url.replace('/api/', '/');
        const targetUrl = OMI_API + targetPath;

        const options = {
            method: req.method,
            headers: { ...req.headers, host: 'api.omi.me' },
        };
        delete options.headers['origin'];
        delete options.headers['referer'];

        const proxyReq = https.request(targetUrl, options, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, {
                ...proxyRes.headers,
                'Access-Control-Allow-Origin': '*',
            });
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (e) => {
            res.writeHead(502);
            res.end(JSON.stringify({ error: 'Proxy error: ' + e.message }));
        });

        req.pipe(proxyReq);
        return;
    }

    // Serve static files
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, filePath.split('?')[0]);

    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`OMI Dashboard running at http://localhost:${PORT}`);
    console.log(`API proxy: /api/* → ${OMI_API}/*`);
});
