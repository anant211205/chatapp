// Connect to socket.io server
const socket = io();

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const chatContainer = document.getElementById('chatContainer');
const usernameInput = document.getElementById('usernameInput');
const loginBtn = document.getElementById('loginBtn');
const currentUsername = document.getElementById('currentUsername');
const userList = document.getElementById('userList');
const friendList = document.getElementById('friendList');
const friendUsernameInput = document.getElementById('friendUsernameInput');
const addFriendBtn = document.getElementById('addFriendBtn');
const chatWith = document.getElementById('chatWith');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const noMessagesPlaceholder = document.getElementById('noMessagesPlaceholder');

// State variables
let username = '';
let friends = [];
let currentChat = null;
let messages = {};

// Login handler
loginBtn.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (username) {
        // Send registration event to server
        socket.emit('register', username);
        
        // Update UI
        currentUsername.textContent = username;
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        
        // Reset the message input field and button state
        messageInput.disabled = true;
        messageInput.readOnly = false; // Ensure readOnly is false
        sendBtn.disabled = true;
    }
});

// Handle Enter key press on username input
usernameInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

// Add friend handler
addFriendBtn.addEventListener('click', () => {
    const friendUsername = friendUsernameInput.value.trim();
    if (friendUsername && friendUsername !== username) {
        console.log(`Attempting to add friend: ${friendUsername}`);
        socket.emit('addFriend', friendUsername);
        friendUsernameInput.value = '';
    } else {
        alert('Please enter a valid username that is not your own.');
    }
});

// Send message handler
sendBtn.addEventListener('click', () => {
    sendMessage();
});

// Handle Enter key press on message input
messageInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Function to send message
function sendMessage() {
    const message = messageInput.value.trim();
    if (message && currentChat) {
        console.log(`Sending message to ${currentChat}: ${message}`);
        
        // Sending message to server
        socket.emit('privateMessage', {
            to: currentChat,
            message: message
        });
        
        // Clear input field
        messageInput.value = '';
        
        // Note: We don't add the message to UI here, it will be added when we receive the messageSent event
    } else if (!currentChat) {
        alert('Please select a friend to chat with first.');
    }
}

// Function to update user list
function updateUserList(users) {
    // Clear current list
    userList.innerHTML = '';
    
    // Add each user except self
    users.forEach(user => {
        if (user.username !== username) {
            const li = document.createElement('li');
            li.textContent = user.username;
            userList.appendChild(li);
        }
    });
}

// Function to update friend list
function updateFriendList() {
    // Clear current list
    friendList.innerHTML = '';
    
    // Add each friend
    friends.forEach(friend => {
        const li = document.createElement('li');
        li.textContent = friend;
        li.dataset.username = friend;
        
        // Add click handler
        li.addEventListener('click', () => {
            console.log(`Selected friend: ${friend} to chat with`);
            
            // Update active chat
            currentChat = friend;
            chatWith.textContent = friend;
            
            // Enable message input - explicitly setting the properties to ensure they work
            messageInput.disabled = false;
            messageInput.readOnly = false;
            sendBtn.disabled = false;
            
            try {
                // Force DOM update and focus
                setTimeout(() => {
                    messageInput.focus();
                    console.log('Message input field focused and enabled:', !messageInput.disabled);
                }, 100);
            } catch (e) {
                console.error('Error focusing input:', e);
            }
            
            // Clear active class from all friends
            document.querySelectorAll('#friendList li').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked friend
            li.classList.add('active');
            
            // Show chat history
            displayMessages(friend);
        });
        
        // Add to list
        friendList.appendChild(li);
    });
    
    // If we have friends but no current chat, select the first one automatically
    if (friends.length > 0 && !currentChat) {
        const firstFriend = friendList.querySelector('li');
        if (firstFriend) {
            firstFriend.click();
        }
    }
}

// Function to add message to UI
function addMessageToUI(from, to, message, isSent = false) {
    // Initialize message array if not exists
    const chatPartner = isSent ? to : from;
    if (!messages[chatPartner]) {
        messages[chatPartner] = [];
    }
    
    // Add message to array
    messages[chatPartner].push({
        from: from,
        message: message,
        timestamp: new Date().toLocaleTimeString()
    });
    
    // If this is the current chat, display the message
    if (currentChat === chatPartner) {
        displayMessages(chatPartner);
    }
}

// Function to display messages for a chat
function displayMessages(chatPartner) {
    // Clear current messages
    messagesContainer.innerHTML = '';
    
    // Create placeholder for empty conversations
    if (!messages[chatPartner] || messages[chatPartner].length === 0) {
        const emptyPlaceholder = document.createElement('div');
        emptyPlaceholder.classList.add('no-messages-selected');
        emptyPlaceholder.textContent = `No messages yet with ${chatPartner}. Say hello!`;
        messagesContainer.appendChild(emptyPlaceholder);
        return;
    }
    
    // Display messages if there are any
    messages[chatPartner].forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        
        // Style based on sender
        if (msg.from === username) {
            messageDiv.classList.add('sent');
        } else {
            messageDiv.classList.add('received');
        }
        
        // Message info (sender and time)
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('message-info');
        infoDiv.textContent = `${msg.from} - ${msg.timestamp}`;
        
        // Message content
        const contentDiv = document.createElement('div');
        contentDiv.textContent = msg.message;
        
        // Add to message div
        messageDiv.appendChild(infoDiv);
        messageDiv.appendChild(contentDiv);
        
        // Add to messages container
        messagesContainer.appendChild(messageDiv);
    });
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Socket event listeners
socket.on('userList', (users) => {
    console.log('Received updated user list:', users);
    updateUserList(users);
});

socket.on('friendAdded', (friendUsername) => {
    console.log(`Friend added: ${friendUsername}`);
    if (!friends.includes(friendUsername)) {
        friends.push(friendUsername);
        updateFriendList();
    }
});

socket.on('addedAsFriend', (friendUsername) => {
    console.log(`Added as friend by: ${friendUsername}`);
    if (!friends.includes(friendUsername)) {
        friends.push(friendUsername);
        updateFriendList();
    }
});

socket.on('privateMessage', (data) => {
    console.log(`Received message from ${data.from}: ${data.message}`);
    addMessageToUI(data.from, username, data.message);
});

socket.on('messageSent', (data) => {
    console.log(`Message sent to ${data.to}: ${data.message}`);
    addMessageToUI(username, data.to, data.message, true);
});

socket.on('error', (message) => {
    alert(`Error: ${message}`);
});

// Network status notification
window.addEventListener('online', () => {
    console.log('Connection restored');
    // Reconnect logic if needed
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
    alert('You are currently offline. Messages will be sent when your connection is restored.');
}); 