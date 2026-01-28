const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;

const licenseAuthor = 'Your Name Here';

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('CSI203: DIGITAL ARCHITECTURE AND OPERATING SYSTEMS\nStarting: startNode.js server...\n');
});

server.listen(port, hostname, () => {
    console.log(`License Author: ${licenseAuthor}`);
    console.log(`Server running at http://${hostname}:${port}/`);
});