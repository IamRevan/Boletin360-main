
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/health', // Assuming infinite login fixed connection but verifying basic ping
    method: 'GET',
};

// Intente con root si health no existe
const optionsRoot = {
    hostname: 'localhost',
    port: 5000,
    path: '/',
    method: 'GET',
};

console.log('--- Testing API Connectivity ---');

const req = http.request(optionsRoot, (res: any) => {
    console.log(`API Ping Status Code: ${res.statusCode}`);
    res.on('data', (d: any) => {
        process.stdout.write(d);
    });
});

req.on('error', (error: any) => {
    console.error('API Ping Error:', error.message);
    console.error('Conclusion: Backend server is NOT reachable on port 5000.');
});

req.end();
