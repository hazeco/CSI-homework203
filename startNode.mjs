import { createServer } from 'node:http';

const hostname = '127.0.0.1';
const port = 3001;
let connections = 0;

const licenseAuthor = 'Your Name Here';

const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('CSI203: DIGITAL ARCHITECTURE AND OPERATING SYSTEMS\nStarting: startNode.mjs server...\n');
});

server.on('connection', (socket) => {
    connections++;
    console.log(`New connection established. Total connections: ${connections}`);
});

server.listen(port, hostname, () => {
    console.log(`License Author: ${licenseAuthor}`);
    console.log(`Server running at http://${hostname}:${port}/`);
});