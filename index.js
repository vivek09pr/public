require('dotenv').config()
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = process.env.PORT || 9000; // Update here
app.use(express.static('public'));
// Handle the root route
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

const chatRooms = {};

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Handle room creation
    socket.on('create room', (code) => {
        chatRooms[code] = { users: [], messages: [] }; // Store users and messages
        socket.join(code);
        socket.emit('joined room', code);
    });

    // Handle joining room
    socket.on('join room', (code, username) => {
        if (chatRooms[code]) {
            chatRooms[code].users.push({ id: socket.id, username: username });
            socket.join(code)
            socket.emit('joined room', code);
            socket.to(code).emit('chat message', {
                username: 'System',
                message: `${username} has joined the chat!`,
                timestamp: new Date().toLocaleTimeString(),
                roomCode: code,
                senderId: socket.id
            });
        } else {
            console.log('Room not found:', code); // Log when room is not found
            socket.emit('error', 'Room not found');
        }
    });

    // Handle chat messages
    socket.on('chat message', (data) => {
        if (chatRooms[data.roomCode]) {
            chatRooms[data.roomCode].messages.push(data); // Save message
        }
        io.to(data.roomCode).emit('chat message', data); // Send to the specific room
    });

    // Handle image sharing
    socket.on('image message', (data) => {
        if (chatRooms[data.roomCode]) {
            chatRooms[data.roomCode].messages.push(data); // Save image message
        }
        io.to(data.roomCode).emit('image message', data); // Send image to the specific room
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // Optionally, handle user disconnection (remove from users list, etc.)
    });
});

server.listen(port, () => { // Use the port variable here
    console.log(`listening on *:${port}`);
});
