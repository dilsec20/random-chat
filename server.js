const express = require('express');
const http = require('http');
const https = require('https');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();

// Trust proxy for ngrok/cloudflare
app.set('trust proxy', 1);

// Disable ngrok warning page (if using ngrok)
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// Check if SSL certificates exist
let server;
const sslKeyPath = path.join(__dirname, 'ssl', 'key.pem');
const sslCertPath = path.join(__dirname, 'ssl', 'cert.pem');

if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
  // HTTPS server
  const options = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath)
  };
  server = https.createServer(options, app);
  console.log('🔒 Running in HTTPS mode');
} else {
  // HTTP server (for local development)
  server = http.createServer(app);
  console.log('🔓 Running in HTTP mode (use http://localhost:3000)');
}

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});

app.use(express.static(path.join(__dirname, 'public')));

// Separate queues for text and video chat
let textWaitingUsers = [];
let videoWaitingUsers = [];
let connectedPairs = new Map(); // socketId -> {partnerId, mode}
let rooms = new Map(); // roomId -> {host, guest, mode}
let onlineUsers = 0;

// Helper: Get random user from waiting list
function getRandomWaitingUser(waitingList) {
  if (waitingList.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * waitingList.length);
  return waitingList.splice(randomIndex, 1)[0];
}

// Helper: Remove user from waiting lists
function removeFromWaiting(socketId) {
  const beforeText = textWaitingUsers.length;
  const beforeVideo = videoWaitingUsers.length;
  
  textWaitingUsers = textWaitingUsers.filter(u => u.id !== socketId);
  videoWaitingUsers = videoWaitingUsers.filter(u => u.id !== socketId);
  
  const removedText = beforeText - textWaitingUsers.length;
  const removedVideo = beforeVideo - videoWaitingUsers.length;
  
  if (removedText > 0) console.log(`🗑️ Removed ${socketId} from text queue`);
  if (removedVideo > 0) console.log(`🗑️ Removed ${socketId} from video queue`);
}

// Helper: Pair two users
function pairUsers(socket, partner, mode) {
  // CRITICAL: Final check - never pair with yourself!
  if (socket.id === partner.id) {
    console.error(`❌ PREVENTED SELF-PAIRING: ${socket.id}`);
    return;
  }
  
  connectedPairs.set(socket.id, { partnerId: partner.id, mode });
  connectedPairs.set(partner.id, { partnerId: socket.id, mode });
  
  console.log(`✅ Paired (${mode}): ${socket.id} ↔ ${partner.id}`);
  
  // For video mode, send initiate-call BEFORE chat-start
  if (mode === 'video') {
    // CRITICAL: Send role assignments FIRST, with longer delay
    setTimeout(() => {
      socket.emit('initiate-call', { isInitiator: true });
      console.log(`📞 ${socket.id} initiates call -> ${partner.id}`);
    }, 200);
    
    setTimeout(() => {
      partner.emit('initiate-call', { isInitiator: false });
    }, 200);
    
    // Then send chat-start after a delay
    setTimeout(() => {
      socket.emit('chat-start', { partnerId: partner.id, mode });
      partner.emit('chat-start', { partnerId: socket.id, mode });
    }, 400);
  } else {
    // For text mode, send immediately
    socket.emit('chat-start', { partnerId: partner.id, mode });
    partner.emit('chat-start', { partnerId: socket.id, mode });
  }
}

// Helper: Disconnect pair and return partner to queue
function disconnectPair(socketId, returnPartnerToQueue = true) {
  const pairInfo = connectedPairs.get(socketId);
  if (!pairInfo) return;
  
  const { partnerId, mode } = pairInfo;
  const partnerSocket = io.sockets.sockets.get(partnerId);
  
  connectedPairs.delete(socketId);
  connectedPairs.delete(partnerId);
  
  if (partnerSocket && returnPartnerToQueue) {
    partnerSocket.emit('partner-disconnected');
    
    // Return partner to waiting queue
    const waitingList = mode === 'text' ? textWaitingUsers : videoWaitingUsers;
    
    // CRITICAL: Make sure they're not already in the queue
    removeFromWaiting(partnerId);
    
    // Add to queue only if not already there
    if (!waitingList.find(u => u.id === partnerId)) {
      waitingList.push(partnerSocket);
      partnerSocket.emit('waiting');
      console.log(`🔁 ${partnerId} returned to ${mode} queue`);
      
      // Try to pair them immediately with another waiting user (NOT themselves)
      const availablePartners = waitingList.filter(u => u.id !== partnerId);
      if (availablePartners.length > 0) {
        const newPartner = getRandomWaitingUser(availablePartners);
        if (newPartner && newPartner.id !== partnerId) {
          removeFromWaiting(partnerId);
          removeFromWaiting(newPartner.id);
          pairUsers(partnerSocket, newPartner, mode);
        }
      }
    }
  }
}

// Helper: Try to pair a waiting user
function tryPairWaitingUser(socket, mode) {
  const waitingList = mode === 'text' ? textWaitingUsers : videoWaitingUsers;
  
  // CRITICAL: Don't pair with yourself!
  const availablePartners = waitingList.filter(u => u.id !== socket.id);
  
  if (availablePartners.length === 0) {
    console.log(`⏳ No available partners for ${socket.id} in ${mode} mode`);
    return;
  }
  
  const partner = getRandomWaitingUser(availablePartners);
  
  if (partner && partner.id !== socket.id) {
    // Remove both users from waiting
    removeFromWaiting(socket.id);
    removeFromWaiting(partner.id);
    pairUsers(socket, partner, mode);
  } else {
    console.log(`⚠️ Could not find valid partner for ${socket.id}`);
  }
}

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('online-count', onlineUsers);
  
  console.log(`👤 Connected: ${socket.id} | Online: ${onlineUsers}`);

  // Start searching for stranger (text or video)
  socket.on('find-stranger', (data) => {
    const mode = data.mode || 'text'; // 'text' or 'video'
    
    // Remove from any existing queue first
    removeFromWaiting(socket.id);
    
    const waitingList = mode === 'text' ? textWaitingUsers : videoWaitingUsers;
    
    // CRITICAL: Filter out yourself from available partners
    const availablePartners = waitingList.filter(u => u.id !== socket.id);
    const partner = getRandomWaitingUser(availablePartners);
    
    if (partner && partner.id !== socket.id) {
      // Remove partner from waiting list
      removeFromWaiting(partner.id);
      pairUsers(socket, partner, mode);
    } else {
      // No valid partner available, add to waiting list
      waitingList.push(socket);
      socket.emit('waiting');
      console.log(`⌛ ${socket.id} waiting for ${mode} chat`);
    }
  });

  // Stop searching
  socket.on('stop-search', () => {
    removeFromWaiting(socket.id);
    console.log(`⏹️ ${socket.id} stopped searching`);
  });

  // Next button - disconnect and find new stranger
  socket.on('next-stranger', () => {
    const pairInfo = connectedPairs.get(socket.id);
    if (pairInfo) {
      const { mode } = pairInfo;
      disconnectPair(socket.id, true);
      
      // Immediately start searching for new partner
      socket.emit('chat-end');
      
      const waitingList = mode === 'text' ? textWaitingUsers : videoWaitingUsers;
      
      // CRITICAL: Don't pair with yourself
      const availablePartners = waitingList.filter(u => u.id !== socket.id);
      const partner = getRandomWaitingUser(availablePartners);
      
      if (partner && partner.id !== socket.id) {
        removeFromWaiting(partner.id);
        pairUsers(socket, partner, mode);
      } else {
        // No valid partner, add to queue
        removeFromWaiting(socket.id); // Clean first
        waitingList.push(socket);
        socket.emit('waiting');
        console.log(`⌛ ${socket.id} waiting after clicking Next`);
      }
      
      console.log(`⏭️ ${socket.id} clicked Next`);
    }
  });

  // Back to menu
  socket.on('back-to-menu', () => {
    disconnectPair(socket.id, true);
    removeFromWaiting(socket.id);
    console.log(`🏠 ${socket.id} returned to menu`);
  });

  // WebRTC Signaling
  socket.on('webrtc-offer', (data) => {
    const pairInfo = connectedPairs.get(socket.id);
    if (pairInfo) {
      console.log(`📤 Forwarding offer from ${socket.id} to ${pairInfo.partnerId}`);
      io.to(pairInfo.partnerId).emit('webrtc-offer', {
        offer: data.offer,
        from: socket.id
      });
    } else {
      console.log(`⚠️ No partner found for offer from ${socket.id}`);
    }
  });

  socket.on('webrtc-answer', (data) => {
    const pairInfo = connectedPairs.get(socket.id);
    if (pairInfo) {
      console.log(`📤 Forwarding answer from ${socket.id} to ${pairInfo.partnerId}`);
      io.to(pairInfo.partnerId).emit('webrtc-answer', {
        answer: data.answer,
        from: socket.id
      });
    } else {
      console.log(`⚠️ No partner found for answer from ${socket.id}`);
    }
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const pairInfo = connectedPairs.get(socket.id);
    if (pairInfo) {
      io.to(pairInfo.partnerId).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        from: socket.id
      });
    }
  });

  // Text Chat Messages
  socket.on('send-message', (message) => {
    const pairInfo = connectedPairs.get(socket.id);
    if (pairInfo) {
      io.to(pairInfo.partnerId).emit('receive-message', {
        message: message,
        from: 'stranger'
      });
    }
  });

  // Typing indicator
  socket.on('typing', (isTyping) => {
    const pairInfo = connectedPairs.get(socket.id);
    if (pairInfo) {
      io.to(pairInfo.partnerId).emit('partner-typing', isTyping);
    }
  });

  // Friend Room - Create
  socket.on('create-room', (data, callback) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const mode = data.mode || 'text';
    rooms.set(roomId, { host: socket.id, guest: null, mode });
    socket.join(roomId);
    socket.roomId = roomId;
    socket.roomMode = mode;
    callback({ roomId, mode });
    console.log(`🏠 Room created: ${roomId} (${mode}) by ${socket.id}`);
  });

  // Friend Room - Join
  socket.on('join-room', (data, callback) => {
    const { roomId } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      callback({ error: 'Room not found' });
      return;
    }
    
    if (room.guest) {
      callback({ error: 'Room is full' });
      return;
    }
    
    room.guest = socket.id;
    socket.join(roomId);
    socket.roomId = roomId;
    socket.roomMode = room.mode;
    
    const hostSocket = io.sockets.sockets.get(room.host);
    
    socket.emit('room-joined', { partnerId: room.host, mode: room.mode });
    if (hostSocket) {
      hostSocket.emit('room-joined', { partnerId: socket.id, mode: room.mode });
    }
    
    callback({ success: true, mode: room.mode });
    console.log(`🚪 User ${socket.id} joined room ${roomId} (${room.mode})`);
  });

  // Room Messages
  socket.on('room-message', (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('room-message-receive', {
        message: data.message,
        from: 'friend'
      });
    }
  });

  // Room Typing
  socket.on('room-typing', (isTyping) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('room-partner-typing', isTyping);
    }
  });

  // Room WebRTC
  socket.on('room-webrtc-offer', (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('room-webrtc-offer', {
        offer: data.offer,
        from: socket.id
      });
    }
  });

  socket.on('room-webrtc-answer', (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('room-webrtc-answer', {
        answer: data.answer,
        from: socket.id
      });
    }
  });

  socket.on('room-webrtc-ice-candidate', (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('room-webrtc-ice-candidate', {
        candidate: data.candidate,
        from: socket.id
      });
    }
  });

  // Leave Room
  socket.on('leave-room', () => {
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        socket.to(socket.roomId).emit('room-partner-left');
        
        if (room.host === socket.id) {
          rooms.delete(socket.roomId);
        } else {
          room.guest = null;
        }
      }
      socket.leave(socket.roomId);
      socket.roomId = null;
      socket.roomMode = null;
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('online-count', onlineUsers);
    
    removeFromWaiting(socket.id);
    disconnectPair(socket.id, true);
    
    // Handle room disconnection
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        socket.to(socket.roomId).emit('room-partner-left');
        
        if (room.host === socket.id) {
          rooms.delete(socket.roomId);
        } else {
          room.guest = null;
        }
      }
    }
    
    console.log(`❌ Disconnected: ${socket.id} | Online: ${onlineUsers}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
