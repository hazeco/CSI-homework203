const WebSocket = require('ws');
const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');

const host = '0.0.0.0'; 
const portNumber = 8080; 
const hostname = os.hostname();
const logFile = path.join(__dirname, 'chat.log');

// Function to write logs to file
function writeLog(message) {
    const timestamp = new Date().toLocaleString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(logFile, logMessage);
}

// Create HTTP server to serve static files
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    // Security check
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const extname = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
    };
    const contentType = mimeTypes[extname] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error', 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

server.listen(portNumber, host, () => {
    writeLog(`HTTP Server running on http://${host}:${portNumber}`);
    writeLog(`WebSocket server Name: ${hostname}`);
    writeLog(`WebSocket server is running on ws://${host}:${portNumber}`);
});

let clientCounter = 0;
const clients = new Map();

// Heartbeat interval - ส่ง ping ให้ clients ทุก 30 วินาที
const heartbeat = setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.isAlive === false) {
            return client.terminate();
        }
        client.isAlive = false;
        client.ping();
    });
}, 30000);

// ฟังการเชื่อมต่อจากไคลเอ็นต์
wss.on('connection', (ws) => {
    const clientId = ++clientCounter;
    clients.set(ws, clientId);
    ws.isAlive = true;
    const clientCount = wss.clients.size;
    
    writeLog(`Client ${clientId} connected. (Total: ${clientCount} clients)`);

    // ฟัง pong จาก client
    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('message', (message) => {
        const msgStr = message.toString();
        const clientId = clients.get(ws);
        writeLog(`Client ${clientId}: ${msgStr}`);

        // Forward message to ALL clients including sender
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    clientId: clientId,
                    message: msgStr,
                    timestamp: new Date().toLocaleTimeString()
                }));
            }
        });
    });

    ws.on('error', (error) => {
        const clientId = clients.get(ws);
        writeLog(`Client ${clientId} error: ${error.message}`);
    });

    ws.on('close', () => {
        const clientId = clients.get(ws);
        clients.delete(ws);
        const clientCount = wss.clients.size;
        writeLog(`Client ${clientId} disconnected. (Total: ${clientCount} clients)`);
    });
});

server.on('close', () => {
    clearInterval(heartbeat);
});