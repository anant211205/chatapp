const socket = io();

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

let username = '';
let friends = [];
let currentChat = null;
let messages = {};

loginBtn.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (username) {
        socket.emit('register', username);
        
        currentUsername.textContent = username;
        loginContainer.classList.add('hidden');
        chatContainer.classList.remove('hidden');
        
        messageInput.disabled = true;
        messageInput.readOnly = false; // Ensure readOnly is false
        sendBtn.disabled = true;
    }
});

usernameInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        loginBtn.click();
    }
});

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

sendBtn.addEventListener('click', () => {
    sendMessage();
});

messageInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && currentChat) {
        console.log(`Sending message to ${currentChat}: ${message}`);
        
        socket.emit('privateMessage', {
            to: currentChat,
            message: message
        });
        
        messageInput.value = '';
        
    } else if (!currentChat) {
        alert('Please select a friend to chat with first.');
    }
}

function updateUserList(users) {
    userList.innerHTML = '';
    
    users.forEach(user => {
        if (user.username !== username) {
            const li = document.createElement('li');
            li.textContent = user.username;
            userList.appendChild(li);
        }
    });
}

function updateFriendList() {
    friendList.innerHTML = '';
    
    friends.forEach(friend => {
        const li = document.createElement('li');
        li.textContent = friend;
        li.dataset.username = friend;
        
        li.addEventListener('click', () => {
            console.log(`Selected friend: ${friend} to chat with`);
            
            currentChat = friend;
            chatWith.textContent = friend;
            
            messageInput.disabled = false;
            messageInput.readOnly = false;
            sendBtn.disabled = false;
            
            try {
                setTimeout(() => {
                    messageInput.focus();
                    console.log('Message input field focused and enabled:', !messageInput.disabled);
                }, 100);
            } catch (e) {
                console.error('Error focusing input:', e);
            }
            
            document.querySelectorAll('#friendList li').forEach(item => {
                item.classList.remove('active');
            });
            
            li.classList.add('active');
            
            displayMessages(friend);
        });
        
        friendList.appendChild(li);
    });
    
    if (friends.length > 0 && !currentChat) {
        const firstFriend = friendList.querySelector('li');
        if (firstFriend) {
            firstFriend.click();
        }
    }
}

function addMessageToUI(from, to, message, isSent = false) {
    const chatPartner = isSent ? to : from;
    if (!messages[chatPartner]) {
        messages[chatPartner] = [];
    }
    
    messages[chatPartner].push({
        from: from,
        message: message,
        timestamp: new Date().toLocaleTimeString()
    });
    
    if (currentChat === chatPartner) {
        displayMessages(chatPartner);
    }
}

function displayMessages(chatPartner) {
    messagesContainer.innerHTML = '';
    
    if (!messages[chatPartner] || messages[chatPartner].length === 0) {
        const emptyPlaceholder = document.createElement('div');
        emptyPlaceholder.classList.add('no-messages-selected');
        emptyPlaceholder.textContent = `No messages yet with ${chatPartner}. Say hello!`;
        messagesContainer.appendChild(emptyPlaceholder);
        return;
    }
    
    messages[chatPartner].forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        
        if (msg.from === username) {
            messageDiv.classList.add('sent');
        } else {
            messageDiv.classList.add('received');
        }
        
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('message-info');
        infoDiv.textContent = `${msg.from} - ${msg.timestamp}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.textContent = msg.message;
        
        messageDiv.appendChild(infoDiv);
        messageDiv.appendChild(contentDiv);
        
        messagesContainer.appendChild(messageDiv);
    });
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

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

window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
    alert('You are currently offline. Messages will be sent when your connection is restored.');
}); 