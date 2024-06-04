const WebSocket = require('ws');

const PORT = 5001;
const wss = new WebSocket.Server({ port: PORT });

const users = {};

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    // console.log('Received message:', data);

    switch (data.type) {
      case 'register':
        users[data.id] = ws;
        ws.id = data.id; // Store user ID in WebSocket connection
        ws.send(JSON.stringify({ type: 'yourID', id: data.id }));
        broadcastUsers();
        break;
      case 'callUser':
        if (users[data.userToCall]) {
          users[data.userToCall].send(JSON.stringify({ type: 'hey', signal: data.signalData, from: data.from }));
        }
        break;
      case 'acceptCall':
        if (users[data.to]) {
          users[data.to].send(JSON.stringify({ type: 'callAccepted', signal: data.signal }));
        }
        break;
      default:
        console.log('Unknown message type:', data.type);
        break;
    }
  });

  ws.on('close', () => {
    console.log(`Client ${ws.id} disconnected`);
    delete users[ws.id];
    broadcast({ type: 'user left', id: ws.id });
    broadcastUsers();
  });
});

function broadcast(message) {
  const messageStr = JSON.stringify(message);
  console.log('Broadcasting:', messageStr); // Added log for debugging
  Object.values(users).forEach((user) => {
    user.send(messageStr);
  });
}

function broadcastUsers() {
  const userIDs = Object.keys(users);
  const message = JSON.stringify({ type: 'allUsers', users: userIDs });
  Object.values(users).forEach((user) => {
    user.send(message);
  });
}

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
