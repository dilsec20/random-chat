const socket = io();

// DOM Elements - Sections
const mainMenu = document.getElementById('main-menu');
const textChatSection = document.getElementById('text-chat-section');
const videoChatSection = document.getElementById('video-chat-section');
const friendRoomSection = document.getElementById('friend-room-section');

// Text Chat Elements
const textBackBtn = document.getElementById('text-back-btn');
const textNextBtn = document.getElementById('text-next-btn');
const textMessageInput = document.getElementById('text-message-input');
const textSendBtn = document.getElementById('text-send-btn');
const textMessagesDiv = document.getElementById('text-messages');
const textTypingIndicator = document.getElementById('text-typing-indicator');

// Video Chat Elements
const videoBackBtn = document.getElementById('video-back-btn');
const videoNextBtn = document.getElementById('video-next-btn');
const localVideo = document.getElementById('local-video');
const strangerVideo = document.getElementById('stranger-video');
const strangerPlaceholder = document.getElementById('stranger-placeholder');
const strangerStatus = document.getElementById('stranger-status');
const videoMessageInput = document.getElementById('video-message-input');
const videoSendBtn = document.getElementById('video-send-btn');
const videoMessagesDiv = document.getElementById('video-messages');
const videoTypingIndicator = document.getElementById('video-typing-indicator');
const muteAudioBtn = document.getElementById('mute-audio-btn');
const muteVideoBtn = document.getElementById('mute-video-btn');
const strangerMuteAudioBtn = document.getElementById('stranger-mute-audio-btn');

// Friend Room Elements
const roomBackBtn = document.getElementById('room-back-btn');
const createRoomBtn = document.getElementById('create-room-btn');
const joinRoomBtn = document.getElementById('join-room-btn');
const roomIdInput = document.getElementById('room-id-input');
const roomIdDisplay = document.getElementById('room-id-display');
const roomError = document.getElementById('room-error');
const roomSetup = document.getElementById('room-setup');
const roomVideoContainer = document.getElementById('room-video-container');
const roomTextArea = document.getElementById('room-text-area');
const roomVideoChat = document.getElementById('room-video-chat');
const roomLocalVideo = document.getElementById('room-local-video');
const roomStrangerVideo = document.getElementById('room-stranger-video');
const roomStrangerPlaceholder = document.getElementById('room-stranger-placeholder');
const roomTextInput = document.getElementById('room-text-input');
const roomTextSendBtn = document.getElementById('room-text-send-btn');
const roomTextMessages = document.getElementById('room-text-messages');
const roomTypingIndicator = document.getElementById('room-typing-indicator');
const roomMessageInput = document.getElementById('room-message-input');
const roomSendBtn = document.getElementById('room-send-btn');
const roomMessages = document.getElementById('room-messages');
const roomVideoTypingIndicator = document.getElementById('room-video-typing-indicator');
const roomModeBadge = document.getElementById('room-mode-badge');
const roomTextModeBtn = document.getElementById('room-text-mode-btn');
const roomVideoModeBtn = document.getElementById('room-video-mode-btn');
const roomMuteAudioBtn = document.getElementById('room-mute-audio-btn');
const roomMuteVideoBtn = document.getElementById('room-mute-video-btn');
const roomStrangerMuteAudioBtn = document.getElementById('room-stranger-mute-audio-btn');

// Online counters
const onlineCountMenu = document.getElementById('online-count-menu');
const onlineCountText = document.getElementById('online-count-text');
const onlineCountVideo = document.getElementById('online-count-video');
const onlineCountRoom = document.getElementById('online-count-room');

// State
let localStream = null;
let peerConnection = null;
let currentMode = null; // 'text' or 'video'
let currentSection = null; // 'random' or 'room'
let isInChat = false;
let currentRoomId = null;
let selectedRoomMode = 'text';
let typingTimeout = null;
let isAudioMuted = false;
let isVideoMuted = false;
let isStrangerAudioMuted = false;
let hasCreatedOffer = false; // Prevent duplicate offers
let hasReceivedOffer = false; // Track offer reception
let myRole = null; // 'initiator' or 'receiver'

const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Multiple TURN servers for better reliability
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    // Alternative TURN servers
    {
      urls: 'turn:numb.viagenie.ca',
      username: 'webrtc@live.com',
      credential: 'muazkh'
    },
    {
      urls: 'turn:192.158.29.39:3478?transport=udp',
      username: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      credential: '28224511:1379330808'
    },
    {
      urls: 'turn:192.158.29.39:3478?transport=tcp',
      username: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      credential: '28224511:1379330808'
    }
  ],
  iceCandidatePoolSize: 10
};

// Menu Navigation
document.getElementById('text-chat-btn').addEventListener('click', () => {
  showSection(textChatSection);
  currentMode = 'text';
  currentSection = 'random';
  startTextChat();
});

document.getElementById('video-chat-btn').addEventListener('click', () => {
  showSection(videoChatSection);
  currentMode = 'video';
  currentSection = 'random';
  startVideoChat();
});

document.getElementById('friend-room-btn').addEventListener('click', () => {
  showSection(friendRoomSection);
  currentSection = 'room';
});

// Back buttons
textBackBtn.addEventListener('click', () => {
  socket.emit('back-to-menu');
  stopChat();
  showSection(mainMenu);
  currentMode = null;
  currentSection = null;
});

videoBackBtn.addEventListener('click', () => {
  socket.emit('back-to-menu');
  stopChat();
  showSection(mainMenu);
  currentMode = null;
  currentSection = null;
});

roomBackBtn.addEventListener('click', () => {
  socket.emit('leave-room');
  stopChat();
  showSection(mainMenu);
  currentMode = null;
  currentSection = null;
  resetRoomUI();
});

// Next buttons
textNextBtn.addEventListener('click', () => {
  socket.emit('next-stranger');
  resetTextChat();
  addTextSystemMessage('Looking for someone new...');
});

videoNextBtn.addEventListener('click', () => {
  socket.emit('next-stranger');
  resetVideoChat();
  strangerStatus.textContent = 'Finding new stranger...';
});

// Room mode selection
roomTextModeBtn.addEventListener('click', () => {
  selectedRoomMode = 'text';
  roomTextModeBtn.classList.add('selected');
  roomVideoModeBtn.classList.remove('selected');
});

roomVideoModeBtn.addEventListener('click', () => {
  selectedRoomMode = 'video';
  roomVideoModeBtn.classList.add('selected');
  roomTextModeBtn.classList.remove('selected');
});

// Text Chat Functions
function startTextChat() {
  addTextSystemMessage('🔍 Looking for someone to chat with...');
  socket.emit('find-stranger', { mode: 'text' });
}

function resetTextChat() {
  textMessagesDiv.innerHTML = '';
  textMessageInput.disabled = true;
  textSendBtn.disabled = true;
  textNextBtn.disabled = true;
  textMessageInput.value = '';
  textTypingIndicator.classList.remove('active');
  isInChat = false;
}

function addTextMessage(text, type) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type}`;
  msgDiv.textContent = text;
  textMessagesDiv.appendChild(msgDiv);
  textMessagesDiv.scrollTop = textMessagesDiv.scrollHeight;
}

function addTextSystemMessage(text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'system-message';
  msgDiv.textContent = text;
  textMessagesDiv.appendChild(msgDiv);
  textMessagesDiv.scrollTop = textMessagesDiv.scrollHeight;
}

function sendTextMessage() {
  const message = textMessageInput.value.trim();
  if (message && isInChat) {
    socket.emit('send-message', message);
    addTextMessage(message, 'sent');
    textMessageInput.value = '';
    socket.emit('typing', false);
  }
}

textSendBtn.addEventListener('click', sendTextMessage);
textMessageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendTextMessage();
});

textMessageInput.addEventListener('input', () => {
  if (isInChat && currentSection === 'random') {
    socket.emit('typing', true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('typing', false);
    }, 1000);
  }
});

// Mute/Unmute Controls - Random Video Chat
muteAudioBtn.addEventListener('click', () => {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      isAudioMuted = !audioTrack.enabled;
      muteAudioBtn.textContent = isAudioMuted ? '🎤' : '🎤';
      muteAudioBtn.classList.toggle('muted', isAudioMuted);
      muteAudioBtn.title = isAudioMuted ? 'Unmute microphone' : 'Mute microphone';
    }
  }
});

muteVideoBtn.addEventListener('click', () => {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      isVideoMuted = !videoTrack.enabled;
      muteVideoBtn.textContent = isVideoMuted ? '📹' : '📹';
      muteVideoBtn.classList.toggle('muted', isVideoMuted);
      muteVideoBtn.title = isVideoMuted ? 'Turn on camera' : 'Turn off camera';
    }
  }
});

strangerMuteAudioBtn.addEventListener('click', () => {
  if (strangerVideo.srcObject) {
    const audioTracks = strangerVideo.srcObject.getAudioTracks();
    if (audioTracks.length > 0) {
      isStrangerAudioMuted = !isStrangerAudioMuted;
      strangerVideo.muted = isStrangerAudioMuted;
      strangerMuteAudioBtn.textContent = isStrangerAudioMuted ? '🔇' : '🔊';
      strangerMuteAudioBtn.classList.toggle('muted', isStrangerAudioMuted);
      strangerMuteAudioBtn.title = isStrangerAudioMuted ? 'Unmute stranger' : 'Mute stranger';
    }
  }
});

// Mute/Unmute Controls - Friend Room
roomMuteAudioBtn.addEventListener('click', () => {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const isMuted = !audioTrack.enabled;
      roomMuteAudioBtn.textContent = isMuted ? '🎤' : '🎤';
      roomMuteAudioBtn.classList.toggle('muted', isMuted);
      roomMuteAudioBtn.title = isMuted ? 'Unmute microphone' : 'Mute microphone';
    }
  }
});

roomMuteVideoBtn.addEventListener('click', () => {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const isMuted = !videoTrack.enabled;
      roomMuteVideoBtn.textContent = isMuted ? '📹' : '📹';
      roomMuteVideoBtn.classList.toggle('muted', isMuted);
      roomMuteVideoBtn.title = isMuted ? 'Turn on camera' : 'Turn off camera';
    }
  }
});

roomStrangerMuteAudioBtn.addEventListener('click', () => {
  if (roomStrangerVideo.srcObject) {
    const audioTracks = roomStrangerVideo.srcObject.getAudioTracks();
    if (audioTracks.length > 0) {
      const isMuted = !roomStrangerVideo.muted;
      roomStrangerVideo.muted = isMuted;
      roomStrangerMuteAudioBtn.textContent = isMuted ? '🔇' : '🔊';
      roomStrangerMuteAudioBtn.classList.toggle('muted', isMuted);
      roomStrangerMuteAudioBtn.title = isMuted ? 'Unmute friend' : 'Mute friend';
    }
  }
});

// Video Chat Functions
async function startVideoChat() {
  try {
    console.log('🎥 Starting video chat - requesting camera/mic...');
    localStream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }, 
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }
    });
    
    localVideo.srcObject = localStream;
    console.log('✅ Local stream obtained:', {
      id: localStream.id,
      tracks: localStream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState
      }))
    });
    
    strangerStatus.textContent = '🔍 Looking for someone...';
    
    // Small delay to ensure video element is ready
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('📡 Emitting find-stranger with video mode...');
    socket.emit('find-stranger', { mode: 'video' });
  } catch (err) {
    console.error('❌ Error accessing media devices:', err);
    addVideoSystemMessage('❌ Please allow camera and microphone access');
    strangerStatus.textContent = '❌ Camera access denied';
  }
}

function resetVideoChat() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  strangerVideo.srcObject = null;
  strangerVideo.muted = false;
  strangerPlaceholder.classList.remove('hidden');
  videoMessagesDiv.innerHTML = '';
  videoMessageInput.disabled = true;
  videoSendBtn.disabled = true;
  videoNextBtn.disabled = true;
  videoMessageInput.value = '';
  videoTypingIndicator.classList.remove('active');
  isInChat = false;
  isAudioMuted = false;
  isVideoMuted = false;
  isStrangerAudioMuted = false;
  hasCreatedOffer = false; // Reset flags
  hasReceivedOffer = false; // Reset flags
  myRole = null; // Reset role
  
  console.log('🔄 Video chat reset - role cleared');
  
  // Reset button states
  muteAudioBtn.classList.remove('muted');
  muteVideoBtn.classList.remove('muted');
  strangerMuteAudioBtn.classList.remove('muted');
  muteAudioBtn.textContent = '🎤';
  muteVideoBtn.textContent = '📹';
  strangerMuteAudioBtn.textContent = '🔊';
  
  // Re-enable local tracks
  if (localStream) {
    localStream.getAudioTracks().forEach(track => track.enabled = true);
    localStream.getVideoTracks().forEach(track => track.enabled = true);
  }
}

function stopChat() {
  resetTextChat();
  resetVideoChat();
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  localVideo.srcObject = null;
}

function addVideoMessage(text, type) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type}`;
  msgDiv.textContent = text;
  videoMessagesDiv.appendChild(msgDiv);
  videoMessagesDiv.scrollTop = videoMessagesDiv.scrollHeight;
}

function addVideoSystemMessage(text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'system-message';
  msgDiv.textContent = text;
  videoMessagesDiv.appendChild(msgDiv);
  videoMessagesDiv.scrollTop = videoMessagesDiv.scrollHeight;
}

function sendVideoMessage() {
  const message = videoMessageInput.value.trim();
  if (message && isInChat) {
    socket.emit('send-message', message);
    addVideoMessage(message, 'sent');
    videoMessageInput.value = '';
    socket.emit('typing', false);
  }
}

videoSendBtn.addEventListener('click', sendVideoMessage);
videoMessageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendVideoMessage();
});

videoMessageInput.addEventListener('input', () => {
  if (isInChat && currentSection === 'random') {
    socket.emit('typing', true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('typing', false);
    }, 1000);
  }
});

// WebRTC Functions
async function createPeerConnection() {
  console.log('🔧 Creating peer connection...');
  console.log('Local stream status:', localStream ? 'EXISTS' : 'MISSING');
  
  if (!localStream && currentMode === 'video') {
    console.error('❌ Cannot create peer connection - no local stream!');
    if (currentSection === 'random') {
      addVideoSystemMessage('❌ Camera not initialized. Please refresh.');
    }
    return;
  }
  
  peerConnection = new RTCPeerConnection(config);
  console.log('✅ Peer connection created');
  
  if (localStream) {
    localStream.getTracks().forEach(track => {
      const sender = peerConnection.addTrack(track, localStream);
      console.log('➕ Added track:', track.kind, 'ID:', track.id);
    });
    console.log('✅ All local tracks added to peer connection');
  }
  
  peerConnection.ontrack = (event) => {
    console.log('📹 Received remote track:', event.track.kind, 'Streams:', event.streams.length);
    if (event.streams && event.streams[0]) {
      console.log('✅ Remote stream ID:', event.streams[0].id);
      if (currentSection === 'random' && currentMode === 'video') {
        strangerVideo.srcObject = event.streams[0];
        strangerPlaceholder.classList.add('hidden');
        console.log('✅ Stranger video connected and displayed');
      } else if (currentSection === 'room') {
        roomStrangerVideo.srcObject = event.streams[0];
        roomStrangerPlaceholder.classList.add('hidden');
        console.log('✅ Room video connected and displayed');
      }
    } else {
      console.error('❌ No stream in track event!');
    }
  };
  
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('🧊 Sending ICE candidate:', event.candidate.type);
      if (currentSection === 'random') {
        socket.emit('webrtc-ice-candidate', { candidate: event.candidate });
      } else if (currentSection === 'room') {
        socket.emit('room-webrtc-ice-candidate', { candidate: event.candidate });
      }
    } else {
      console.log('✅ All ICE candidates sent (null candidate)');
    }
  };
  
  peerConnection.oniceconnectionstatechange = () => {
    console.log('🔌 ICE Connection State:', peerConnection.iceConnectionState);
    
    if (peerConnection.iceConnectionState === 'connected') {
      console.log('✅ WebRTC Connected Successfully!');
      if (currentSection === 'random' && currentMode === 'video') {
        addVideoSystemMessage('✅ Video connected');
      }
    }
    
    if (peerConnection.iceConnectionState === 'checking') {
      console.log('🔍 Checking connection...');
    }
    
    if (peerConnection.iceConnectionState === 'disconnected') {
      console.log('⚠️ WebRTC Disconnected');
    }
    
    if (peerConnection.iceConnectionState === 'failed') {
      console.log('❌ WebRTC Connection Failed - Retrying...');
      // Try to restart ICE
      if (peerConnection) {
        peerConnection.restartIce();
        console.log('🔄 Attempting ICE restart...');
      }
    }
  };
  
  peerConnection.onicegatheringstatechange = () => {
    console.log('📡 ICE Gathering State:', peerConnection.iceGatheringState);
  };
  
  peerConnection.onconnectionstatechange = () => {
    console.log('🌐 Connection State:', peerConnection.connectionState);
    
    if (peerConnection.connectionState === 'connected') {
      console.log('🎉 Peer connection fully established!');
    }
    
    if (peerConnection.connectionState === 'failed') {
      console.log('❌ Connection failed - using TURN relay');
      if (currentSection === 'random' && currentMode === 'video') {
        addVideoSystemMessage('⚠️ Connection issues - retrying...');
      }
    }
  };
}

async function createOffer() {
  try {
    // CRITICAL: Only initiator can create offer
    if (myRole !== 'initiator') {
      console.error('❌ BLOCKED: Only initiator can create offer! My role:', myRole);
      return;
    }
    
    // Prevent duplicate offer creation
    if (hasCreatedOffer) {
      console.log('⚠️ Offer already created, skipping...');
      return;
    }
    
    console.log('═══════════════════════════════════');
    console.log('📤 CREATE OFFER - START');
    console.log('My Role:', myRole);
    console.log('Current section:', currentSection);
    console.log('Current mode:', currentMode);
    console.log('Local stream:', localStream ? 'EXISTS' : 'MISSING');
    
    await createPeerConnection();
    console.log('✅ Peer connection created');
    
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    console.log('✅ Offer created:', offer.type);
    
    await peerConnection.setLocalDescription(offer);
    console.log('✅ Local description set');
    
    hasCreatedOffer = true; // Mark as created
    
    if (currentSection === 'random') {
      socket.emit('webrtc-offer', { offer });
      console.log('📡 Offer sent to stranger via socket');
    } else if (currentSection === 'room') {
      socket.emit('room-webrtc-offer', { offer });
      console.log('📡 Offer sent to friend via socket');
    }
    console.log('📤 CREATE OFFER - END');
    console.log('═══════════════════════════════════');
  } catch (error) {
    console.error('❌ Error creating offer:', error);
    console.error('Error stack:', error.stack);
    hasCreatedOffer = false; // Reset on error
  }
}

async function handleOffer(offer) {
  try {
    // CRITICAL: Only receiver should handle offers
    if (myRole === 'initiator') {
      console.warn('⚠️ I am initiator, should not receive offer! Ignoring...');
      return;
    }
    
    // Prevent creating offer if we already received one
    if (hasReceivedOffer) {
      console.log('⚠️ Already received an offer, ignoring duplicate...');
      return;
    }
    
    console.log('═══════════════════════════════════');
    console.log('📥 HANDLE OFFER - START');
    console.log('My Role:', myRole);
    console.log('Current section:', currentSection);
    console.log('Current mode:', currentMode);
    console.log('Local stream:', localStream ? 'EXISTS' : 'MISSING');
    
    hasReceivedOffer = true; // Mark as received
    
    await createPeerConnection();
    console.log('✅ Peer connection created');
    
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    console.log('✅ Remote description set');
    
    const answer = await peerConnection.createAnswer();
    console.log('✅ Answer created:', answer.type);
    
    await peerConnection.setLocalDescription(answer);
    console.log('✅ Local description set');
    
    if (currentSection === 'random') {
      socket.emit('webrtc-answer', { answer });
      console.log('📡 Answer sent to stranger via socket');
    } else if (currentSection === 'room') {
      socket.emit('room-webrtc-answer', { answer });
      console.log('📡 Answer sent to friend via socket');
    }
    console.log('📥 HANDLE OFFER - END');
    console.log('═══════════════════════════════════');
  } catch (error) {
    console.error('❌ Error handling offer:', error);
    console.error('Error stack:', error.stack);
    hasReceivedOffer = false; // Reset on error
  }
}

async function handleAnswer(answer) {
  try {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Remote answer set successfully');
    }
  } catch (error) {
    console.error('❌ Error handling answer:', error);
  }
}

async function handleIceCandidate(candidate) {
  try {
    if (peerConnection && peerConnection.remoteDescription) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ ICE candidate added');
    } else {
      console.log('⏳ Waiting for remote description before adding ICE candidate');
    }
  } catch (error) {
    console.error('❌ Error adding ICE candidate:', error);
  }
}

// Friend Room Functions
createRoomBtn.addEventListener('click', async () => {
  if (selectedRoomMode === 'video') {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      roomLocalVideo.srcObject = localStream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      roomError.textContent = 'Please allow camera and microphone access';
      return;
    }
  }
  
  socket.emit('create-room', { mode: selectedRoomMode }, (response) => {
    currentRoomId = response.roomId;
    currentMode = response.mode;
    roomIdDisplay.textContent = `Room: ${response.roomId}`;
    roomModeBadge.textContent = response.mode === 'text' ? '💬 Text Chat' : '📹 Video Chat';
    roomSetup.style.display = 'none';
    
    if (response.mode === 'video') {
      roomVideoContainer.style.display = 'flex';
      roomVideoChat.style.display = 'flex';
    } else {
      roomTextArea.style.display = 'flex';
    }
    
    roomError.textContent = '';
  });
});

joinRoomBtn.addEventListener('click', () => {
  const roomId = roomIdInput.value.trim().toUpperCase();
  if (!roomId) {
    roomError.textContent = 'Please enter a room code';
    return;
  }
  
  socket.emit('join-room', { roomId }, async (response) => {
    if (response.error) {
      roomError.textContent = response.error;
    } else {
      currentRoomId = roomId;
      currentMode = response.mode;
      
      if (response.mode === 'video') {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          roomLocalVideo.srcObject = localStream;
        } catch (err) {
          console.error('Error accessing media devices:', err);
          roomError.textContent = 'Please allow camera and microphone access';
          return;
        }
      }
      
      roomIdDisplay.textContent = `Room: ${roomId}`;
      roomModeBadge.textContent = response.mode === 'text' ? '💬 Text Chat' : '📹 Video Chat';
      roomSetup.style.display = 'none';
      
      if (response.mode === 'video') {
        roomVideoContainer.style.display = 'flex';
        roomVideoChat.style.display = 'flex';
      } else {
        roomTextArea.style.display = 'flex';
      }
      
      roomError.textContent = '';
    }
  });
});

function addRoomTextMessage(text, type) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type}`;
  msgDiv.textContent = text;
  roomTextMessages.appendChild(msgDiv);
  roomTextMessages.scrollTop = roomTextMessages.scrollHeight;
}

function addRoomTextSystemMessage(text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'system-message';
  msgDiv.textContent = text;
  roomTextMessages.appendChild(msgDiv);
  roomTextMessages.scrollTop = roomTextMessages.scrollHeight;
}

function sendRoomTextMessage() {
  const message = roomTextInput.value.trim();
  if (message) {
    socket.emit('room-message', { message });
    addRoomTextMessage(message, 'sent');
    roomTextInput.value = '';
    socket.emit('room-typing', false);
  }
}

roomTextSendBtn.addEventListener('click', sendRoomTextMessage);
roomTextInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendRoomTextMessage();
});

roomTextInput.addEventListener('input', () => {
  socket.emit('room-typing', true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('room-typing', false);
  }, 1000);
});

function addRoomVideoMessage(text, type) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${type}`;
  msgDiv.textContent = text;
  roomMessages.appendChild(msgDiv);
  roomMessages.scrollTop = roomMessages.scrollHeight;
}

function addRoomVideoSystemMessage(text) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'system-message';
  msgDiv.textContent = text;
  roomMessages.appendChild(msgDiv);
  roomMessages.scrollTop = roomMessages.scrollHeight;
}

function sendRoomVideoMessage() {
  const message = roomMessageInput.value.trim();
  if (message) {
    socket.emit('room-message', { message });
    addRoomVideoMessage(message, 'sent');
    roomMessageInput.value = '';
    socket.emit('room-typing', false);
  }
}

roomSendBtn.addEventListener('click', sendRoomVideoMessage);
roomMessageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendRoomVideoMessage();
});

roomMessageInput.addEventListener('input', () => {
  socket.emit('room-typing', true);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('room-typing', false);
  }, 1000);
});

function resetRoomUI() {
  roomSetup.style.display = 'flex';
  roomVideoContainer.style.display = 'none';
  roomTextArea.style.display = 'none';
  roomVideoChat.style.display = 'none';
  roomIdInput.value = '';
  roomError.textContent = '';
  roomTextMessages.innerHTML = '';
  roomMessages.innerHTML = '';
  roomStrangerVideo.srcObject = null;
  roomStrangerPlaceholder.classList.remove('hidden');
  roomIdDisplay.textContent = '';
  roomTypingIndicator.classList.remove('active');
  roomVideoTypingIndicator.classList.remove('active');
  currentRoomId = null;
  selectedRoomMode = 'text';
  roomTextModeBtn.classList.remove('selected');
  roomVideoModeBtn.classList.remove('selected');
}

// Socket Events - Random Chat
socket.on('room-partner-typing', (isTyping) => {
  if (currentMode === 'text') {
    if (isTyping) {
      roomTypingIndicator.classList.add('active');
    } else {
      roomTypingIndicator.classList.remove('active');
    }
  } else if (currentMode === 'video') {
    if (isTyping) {
      roomVideoTypingIndicator.classList.add('active');
    } else {
      roomVideoTypingIndicator.classList.remove('active');
    }
  }
});

socket.on('room-partner-left', () => {
  if (currentMode === 'text') {
    addRoomTextSystemMessage('❌ Friend disconnected');
  } else if (currentMode === 'video') {
    addRoomVideoSystemMessage('❌ Friend disconnected');
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    roomStrangerVideo.srcObject = null;
    roomStrangerPlaceholder.classList.remove('hidden');
  }
});

// Socket Events - WebRTC Friend Room
socket.on('room-webrtc-offer', async (data) => {
  console.log('📥 Received room WebRTC offer from:', data.from);
  console.log('Current mode:', currentMode, 'Section:', currentSection);
  console.log('Local stream exists:', !!localStream);
  console.log('Local stream tracks:', localStream ? localStream.getTracks().length : 0);
  await handleOffer(data.offer);
});

socket.on('room-webrtc-answer', async (data) => {
  console.log('📥 Received room WebRTC answer from:', data.from);
  await handleAnswer(data.answer);
});

socket.on('room-webrtc-ice-candidate', async (data) => {
  console.log('🧊 Received room ICE candidate');
  await handleIceCandidate(data.candidate);
});

// Socket Events - Online Counter
socket.on('online-count', (count) => {
  onlineCountMenu.textContent = count;
  onlineCountText.textContent = count;
  onlineCountVideo.textContent = count;
  onlineCountRoom.textContent = count;
});

// Helper Functions
function showSection(section) {
  mainMenu.classList.remove('active');
  textChatSection.classList.remove('active');
  videoChatSection.classList.remove('active');
  friendRoomSection.classList.remove('active');
  section.classList.add('active');
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  if (peerConnection) {
    peerConnection.close();
  }
});('waiting', () => {
  if (currentMode === 'text') {
    addTextSystemMessage('⏳ Waiting for someone...');
  } else if (currentMode === 'video') {
    strangerStatus.textContent = '⏳ Waiting for someone...';
  }
});

socket.on('chat-start', async () => {
  isInChat = true;
  
  if (currentMode === 'text') {
    addTextSystemMessage('✅ Connected to a stranger!');
    textMessageInput.disabled = false;
    textSendBtn.disabled = false;
    textNextBtn.disabled = false;
  } else if (currentMode === 'video') {
    strangerStatus.textContent = '✅ Connected! Starting video...';
    videoMessageInput.disabled = false;
    videoSendBtn.disabled = false;
    videoNextBtn.disabled = false;
    addVideoSystemMessage('✅ Connected to a stranger!');
    await createOffer();
  }
});

socket.on('chat-end', () => {
  if (currentMode === 'text') {
    resetTextChat();
    addTextSystemMessage('🔍 Looking for someone new...');
  } else if (currentMode === 'video') {
    resetVideoChat();
    strangerStatus.textContent = '🔍 Looking for someone new...';
  }
});

socket.on('partner-disconnected', () => {
  isInChat = false;
  
  if (currentMode === 'text') {
    addTextSystemMessage('❌ Stranger disconnected');
    addTextSystemMessage('🔍 Looking for someone new...');
  } else if (currentMode === 'video') {
    addVideoSystemMessage('❌ Stranger disconnected');
    strangerStatus.textContent = '🔍 Looking for someone new...';
    resetVideoChat();
  }
});

socket.on('receive-message', (data) => {
  if (currentMode === 'text') {
    addTextMessage(data.message, 'received');
  } else if (currentMode === 'video') {
    addVideoMessage(data.message, 'received');
  }
});

socket.on('partner-typing', (isTyping) => {
  if (currentMode === 'text') {
    if (isTyping) {
      textTypingIndicator.classList.add('active');
    } else {
      textTypingIndicator.classList.remove('active');
    }
  } else if (currentMode === 'video') {
    if (isTyping) {
      videoTypingIndicator.classList.add('active');
    } else {
      videoTypingIndicator.classList.remove('active');
    }
  }
});

// Socket Events - WebRTC Random Chat
socket.on('webrtc-offer', async (data) => {
  console.log('📥 Received WebRTC offer from:', data.from);
  console.log('Current mode:', currentMode, 'Section:', currentSection);
  console.log('Local stream exists:', !!localStream);
  if (localStream) {
    console.log('Local stream tracks:', localStream.getTracks().map(t => t.kind));
  }
  
  if (currentMode === 'video' && currentSection === 'random') {
    console.log('✅ Conditions met - Handling offer...');
    await handleOffer(data.offer);
  } else {
    console.error('❌ Wrong mode or section!', {currentMode, currentSection});
  }
});

socket.on('webrtc-answer', async (data) => {
  console.log('📥 Received WebRTC answer from:', data.from);
  if (currentMode === 'video' && currentSection === 'random') {
    console.log('✅ Handling answer...');
    await handleAnswer(data.answer);
  } else {
    console.error('❌ Wrong mode or section for answer!');
  }
});

socket.on('webrtc-ice-candidate', async (data) => {
  console.log('🧊 Received ICE candidate from remote');
  await handleIceCandidate(data.candidate);
});

// Socket Events - Friend Room
socket.on('room-joined', async (data) => {
  console.log('🏠 Room joined! Partner ID:', data.partnerId, 'Mode:', data.mode);
  console.log('Local stream exists:', !!localStream);
  console.log('Local stream tracks:', localStream ? localStream.getTracks().length : 0);
  
  if (currentMode === 'text') {
    addRoomTextSystemMessage('✅ Friend connected');
  } else if (currentMode === 'video') {
    addRoomVideoSystemMessage('✅ Friend connected - establishing video...');
    
    // Small delay to ensure both clients are ready
    console.log('⏳ Waiting 500ms before creating offer...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('📤 Starting WebRTC offer for room...');
    await createOffer();
  }
});

socket.on('room-message-receive', (data) => {
  if (currentMode === 'text') {
    addRoomTextMessage(data.message, 'received');
  } else if (currentMode === 'video') {
    addRoomVideoMessage(data.message, 'received');
  }
});

socket.on
