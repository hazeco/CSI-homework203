let socket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let reconnectDelay = 3000; // 3 seconds
let myClientId = null; // Track our own client ID

const sendBtn = document.getElementById('sendBtn');
const messageInput = document.getElementById('message');
const chatBox = document.getElementById('chatBox');
const statusEl = document.getElementById('status');
const statusDot = document.getElementById('statusDot');
const myClientIdEl = document.getElementById('myClientId');

function connectWebSocket() {
    socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
        statusEl.textContent = 'Connected';
        statusDot.classList.remove('bg-red-500');
        statusDot.classList.add('bg-green-500');
        reconnectAttempts = 0;
        reconnectDelay = 3000;
        console.log('WebSocket connected');
    };

    socket.onerror = (error) => {
        statusEl.textContent = 'Error';
        statusDot.classList.remove('bg-green-500');
        statusDot.classList.add('bg-red-500');
        console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
        statusEl.textContent = 'Disconnected';
        statusDot.classList.remove('bg-green-500');
        statusDot.classList.add('bg-red-500');
        console.log('WebSocket disconnected');
        
        // Reconnect with exponential backoff
        if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Reconnecting in ${reconnectDelay}ms... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
            addSystemMessage(`Reconnecting in ${reconnectDelay / 1000}s...`);
            setTimeout(connectWebSocket, reconnectDelay);
            reconnectDelay = Math.min(reconnectDelay * 1.5, 15000); // Max 15 seconds
        } else {
            addSystemMessage('✗ Connection failed. Please refresh the page.');
            statusEl.textContent = 'Failed to connect';
        }
    };

    // Receive messages
    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // If this is from our client, update myClientId if not set
            if (!myClientId) {
                myClientId = data.clientId;
                myClientIdEl.textContent = `Client ${myClientId}`;
            }
            
            const isOwn = data.clientId === myClientId;
            displayMessage(data.clientId, data.message, data.timestamp, isOwn);
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    };
}

// Send message
function sendMessage() {
    const message = messageInput.value.trim();
    if (message && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(message);
        messageInput.value = '';
        messageInput.focus();
    } else if (!message) {
        return;
    } else {
        addSystemMessage('⚠ Not connected. Trying to reconnect...');
    }
}

// Display message with Instagram DM style
function displayMessage(clientId, message, timestamp, isOwn) {
    const msgElement = document.createElement('div');
    msgElement.classList.add('flex', isOwn ? 'justify-end' : 'justify-start', 'message-bubble');
    
    if (isOwn) {
        // Own message - right side, blue background
        msgElement.innerHTML = `
            <div class="flex flex-col items-end max-w-xs">
                <div class="text-xs text-gray-500 mb-1">${timestamp}</div>
                <div class="own-message text-white px-4 py-2 rounded-3xl rounded-tr-none break-words">
                    <p class="text-sm">${escapeHtml(message)}</p>
                </div>
            </div>
        `;
    } else {
        // Other's message - left side, gray background
        msgElement.innerHTML = `
            <div class="flex flex-col items-start max-w-xs">
                <div class="text-xs text-gray-500 font-semibold mb-1">Client ${clientId}</div>
                <div class="other-message text-gray-900 px-4 py-2 rounded-3xl rounded-tl-none break-words">
                    <p class="text-sm">${escapeHtml(message)}</p>
                </div>
            </div>
        `;
    }
    
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// System message
function addSystemMessage(text) {
    const msgElement = document.createElement('div');
    msgElement.classList.add('flex', 'justify-center', 'my-3');
    msgElement.innerHTML = `
        <div class="text-center">
            <p class="text-xs text-gray-500">${text}</p>
        </div>
    `;
    chatBox.appendChild(msgElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

// Initial connection
connectWebSocket();