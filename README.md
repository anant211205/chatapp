# Simple Chat Application

A real-time chat application built with Node.js and Socket.io for a Computer Networks project.

## Features

- Real-time messaging using WebSockets (Socket.io)
- User registration with usernames
- Add friends functionality
- Private messaging between friends
- Online/offline status detection
- Simple and intuitive UI

## Computer Network Concepts Demonstrated

- WebSockets: Bidirectional communication channel between client and server
- Real-time Data Transfer: Messages are sent and received instantly
- Connection Management: Handling client connections and disconnections
- Peer-to-Peer Communication: Direct messaging between users
- Network Status Detection: Online/offline status monitoring

## Installation

1. Clone this repository
2. Install dependencies
```
npm install
```
3. Start the server
```
npm start
```
4. Access the application at `http://localhost:3002`

## How to Use

1. Open the application in your browser
2. Enter a username to login
3. See other online users in the Users list
4. Add friends by entering their username in the "Add Friend" field
5. Click on a friend's name to start chatting
6. Type messages and press Enter or click Send to send messages

## Dependencies

- Express: Web server framework
- Socket.io: Real-time bidirectional event-based communication
- CORS: Cross-Origin Resource Sharing support
- Nodemon: Development tool for automatic server restart (dev dependency)

## Project Structure

- `server.js`: Main server file with Express and Socket.io setup
- `public/`: Client-side files
  - `index.html`: HTML structure
  - `styles.css`: Styling
  - `script.js`: Client-side JavaScript with Socket.io integration 