const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const users = {};
const userSockets = {};

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('register', (username) => {
    console.log(`User registered: ${username}`);
    users[socket.id] = {
      id: socket.id,
      username: username,
      friends: []
    };
    userSockets[username] = socket.id;
    
    io.emit('userList', Object.values(users));
  });
  
  socket.on('addFriend', (friendUsername) => {
    const user = users[socket.id];
    const friendSocketId = userSockets[friendUsername];
    
    if (user && friendSocketId && users[friendSocketId]) {
      if (!user.friends.includes(friendUsername)) {
        user.friends.push(friendUsername);
        console.log(`${user.username} added ${friendUsername} as friend`);
        socket.emit('friendAdded', friendUsername);
        
        const friendUser = users[friendSocketId];
        if (!friendUser.friends.includes(user.username)) {
          friendUser.friends.push(user.username);
          io.to(friendSocketId).emit('friendAdded', user.username);
        }
        
        io.to(friendSocketId).emit('addedAsFriend', user.username);
      }
    } else {
      socket.emit('error', 'User not found');
    }
  });
  
  socket.on('privateMessage', ({ to, message }) => {
    const fromUser = users[socket.id];
    const toSocketId = userSockets[to];
    
    console.log(`Message from ${fromUser?.username} to ${to}: ${message}`);
    console.log(`Recipient socket ID: ${toSocketId}`);
    
    if (fromUser && toSocketId) {
      io.to(toSocketId).emit('privateMessage', {
        from: fromUser.username,
        message: message
      });
      
      socket.emit('messageSent', {
        to: to,
        message: message
      });
      
      console.log(`Message delivered successfully`);
    } else {
      console.log(`Message delivery failed. fromUser: ${!!fromUser}, toSocketId: ${!!toSocketId}`);
      socket.emit('error', 'Could not send message');
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (users[socket.id]) {
      const username = users[socket.id].username;
      delete userSockets[username];
      delete users[socket.id];
      io.emit('userList', Object.values(users));
    }
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}); 