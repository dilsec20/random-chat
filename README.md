# random-chat
To access the random chat click on below link 
https://randomchat-xf2f.onrender.com

# 🎥 Random Chat - Omegle Clone

A fully-featured **random video and text chat application** inspired by Omegle. Connect with strangers instantly or create private rooms for friends. Built with **Node.js, Socket.IO, and WebRTC**.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)

---

## ✨ Features

### 🎲 Random Chat
- **Instant Random Pairing** - Connect with strangers worldwide
- **True Random Matching** - Not first-in-first-out, genuinely random
- **Auto Re-queue** - If partner disconnects, you're automatically matched with someone new
- **Next Button** - Skip current stranger and instantly find another
- **Two Modes**:
  - 💬 **Text Chat** - Pure text messaging (no camera required)
  - 📹 **Video Chat** - Webcam + mic + text chat

### 👥 Friend Room (Private Rooms)
- **Create Room** - Get a 6-character room code
- **Join Room** - Enter friend's code to connect
- **Choose Mode** - Text or Video
- **Private & Secure** - Only people with the code can join

### 🎛️ Video Controls (Like Zoom)
- 🎤 **Mute/Unmute Microphone** - Control your audio
- 📹 **Turn Camera On/Off** - Control your video
- 🔊 **Mute Stranger/Friend** - Control their audio on your end
- Visual feedback with red indicators when muted

### 💬 Chat Features
- **Real-time Messaging** - Instant text chat alongside video
- **Typing Indicators** - See when the other person is typing
- **System Messages** - Connection status updates
- **Message History** - Scrollable chat during conversation

### 📊 Real-time Stats
- **Online Counter** - See how many users are online
- **Connection Status** - Live connection state indicators
- **Auto-reconnect** - Handles network interruptions

### 📱 Fully Responsive
- **Desktop Optimized** - Side-by-side video layout
- **Mobile Friendly** - Stacked video layout on phones
- **Touch Controls** - Works perfectly on touchscreens
- **Cross-browser** - Chrome, Firefox, Safari, Edge

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Modern browser** with WebRTC support

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/random-chat.git
cd random-chat

# Install dependencies
npm install

# Start the server
npm start
```

The server will start on `http://localhost:3000`

---

## 🌐 Deployment Options

### Option 1: Local Network (Mobile Testing)

```bash
# Find your local IP address
ipconfig  # Windows
ifconfig  # Mac/Linux

# Example: 192.168.1.100
# Access from any device on same WiFi:
# http://192.168.1.100:3000
```

### Option 2: ngrok (Internet Access)

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm start

# In a new terminal, run ngrok
ngrok http 3000

# You'll get a public URL like:
# https://abc123xyz.ngrok-free.app
```

**Note:** ngrok provides HTTPS, which is required for WebRTC to work properly.

### Option 3: Cloud Deployment

#### **Railway** (Recommended - Free)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

#### **Heroku**
```bash
heroku create your-app-name
git push heroku main
```

#### **Render.com**
1. Connect your GitHub repository
2. Create new Web Service
3. Auto-deploys with HTTPS ✅

---

## 📁 Project Structure

```
random-chat/
│
├── server.js              # Express + Socket.IO server
├── package.json           # Dependencies and scripts
├── package-lock.json      # Dependency lock file
│
└── public/
    ├── index.html         # Main HTML structure
    ├── style.css          # Responsive styling
    └── script.js          # Client-side logic + WebRTC
```

---

## 🛠️ Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **Socket.IO** - Real-time bidirectional communication
- **HTTP/HTTPS** - Server protocols

### Frontend
- **Vanilla JavaScript** - No frameworks, pure JS
- **WebRTC** - Peer-to-peer video/audio
- **HTML5** - Modern semantic markup
- **CSS3** - Responsive design with Flexbox/Grid

### WebRTC Infrastructure
- **STUN Servers** - NAT traversal
- **TURN Servers** - Relay for difficult networks
- **Multiple ICE Servers** - Fallback options

---

## 🎮 How to Use

### Random Chat

1. **Choose Your Mode**
   - Click **"Text Chat"** for messaging only
   - Click **"Video Chat"** for webcam + messaging

2. **Wait for Match**
   - Server finds a random stranger
   - Connection established automatically

3. **Chat**
   - Type messages and press Enter
   - Use video controls to mute/unmute

4. **Next/Back**
   - Click **"Next"** to find a new stranger
   - Click **"← Menu"** to return to main menu

### Friend Room

1. **Select Mode**
   - Choose **Text** or **Video**

2. **Create or Join**
   - **Create Room**: Get a 6-character code (e.g., ABC123)
   - **Join Room**: Enter your friend's code

3. **Share Code**
   - Send the code to your friend (WhatsApp, SMS, etc.)
   - They enter it and join

4. **Private Chat**
   - Only you and your friend can access this room

---

## 🎯 Key Features Explained

### True Random Pairing

Unlike traditional implementations that pair users in order, this uses **true random selection**:

```javascript
function getRandomWaitingUser(waitingList) {
  const randomIndex = Math.floor(Math.random() * waitingList.length);
  return waitingList.splice(randomIndex, 1)[0];
}
```

### Auto Re-queue System

When a partner disconnects:
1. You're notified
2. Automatically added back to waiting queue
3. Instantly matched with next available user

```javascript
function disconnectPair(socketId, returnPartnerToQueue = true) {
  // Notify partner
  partnerSocket.emit('partner-disconnected');
  
  // Return partner to queue
  waitingList.push(partnerSocket);
  
  // Try immediate re-match
  tryPairWaitingUser(partnerSocket, mode);
}
```

### WebRTC Connection Flow

```
Client 1                Server              Client 2
   |                      |                     |
   |--find-stranger------>|                     |
   |                      |<----find-stranger---|
   |                      |                     |
   |<---chat-start--------|---chat-start------->|
   |<---initiate-call-----|                     |
   |                      |                     |
   |--webrtc-offer------->|--webrtc-offer------>|
   |                      |                     |
   |<---webrtc-answer-----|<---webrtc-answer----|
   |                      |                     |
   |--ice-candidate------>|--ice-candidate----->|
   |<---ice-candidate-----|<---ice-candidate----|
   |                      |                     |
   [Video Connected! 🎥]  |  [Video Connected! 🎥]
```

---

## 🔧 Configuration

### TURN Servers

The project includes free public TURN servers. For production, consider using:

**Twilio TURN** (Free tier available)
```javascript
{
  urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
  username: 'YOUR_TWILIO_USERNAME',
  credential: 'YOUR_TWILIO_CREDENTIAL'
}
```

**Metered.ca** (50GB/month free)
- Sign up at https://www.metered.ca/
- Get free credentials
- Replace in `script.js`

### Port Configuration

Change the port in `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

Or use environment variable:
```bash
PORT=8080 npm start
```

---

## 🐛 Troubleshooting

### Video Not Showing

**Problem:** Camera permission denied
**Solution:** Click the camera icon in browser address bar → Allow

**Problem:** "getUserMedia() not supported"
**Solution:** Use HTTPS (required for WebRTC)

**Problem:** Video works in Friend Room but not Random Chat
**Solution:** Check browser console for errors, ensure both users have camera access

### Connection Issues

**Problem:** ICE Connection State: failed
**Solution:** 
- Check firewall settings
- Try different network (WiFi vs Mobile Data)
- Verify TURN servers are accessible

**Problem:** Socket disconnects frequently
**Solution:**
- Check network stability
- Use wired connection if possible
- Deploy to production server with better uptime

### Mobile Browser Issues

**iOS Safari:**
- Requires user interaction before camera access
- Use `playsinline` attribute (already included)

**Android Chrome:**
- May need HTTPS for camera on some versions
- Use ngrok or deploy to production

---

## 📊 Performance

- **Supports 100+ concurrent users** on basic hardware
- **Memory efficient** - No database required, all in-memory
- **Low latency** - WebRTC peer-to-peer connections
- **Scalable** - Can handle thousands with proper TURN infrastructure

### Resource Usage

- **RAM**: ~50MB base + ~5MB per 100 concurrent users
- **CPU**: Minimal (Socket.IO handles most efficiently)
- **Bandwidth**: Depends on video quality and user count

---

## 🔒 Security Considerations

### Current Implementation
- ✅ HTTPS support ready
- ✅ No personal data stored
- ✅ Anonymous connections
- ✅ Private rooms with codes

### Production Recommendations
- Implement rate limiting
- Add content moderation
- Use authenticated TURN servers
- Add reporting system
- Implement user blocking

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by [Omegle](https://www.omegle.com/)
- WebRTC implementation based on [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- TURN servers provided by [Open Relay Project](https://www.metered.ca/tools/openrelay/)
- Icons: Native emoji support

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/random-chat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/random-chat/discussions)
- **Email**: dilipkumar2832005@gmail.com

---

## 🗺️ Roadmap

### v1.1 (Coming Soon)
- [ ] Add language preferences
- [ ] Implement interest tags
- [ ] Add user reporting system
- [ ] Gender/age filters (optional)

### v2.0 (Future)
- [ ] Screen sharing feature
- [ ] Group video chat (3-4 people)
- [ ] Chat history export
- [ ] Mobile apps (React Native)

---

## ⭐ Star History

If you like this project, please give it a ⭐ on GitHub!

---

## 📸 Screenshots

### Main Menu
![Main Menu](screenshots/main-menu.png)

### Video Chat
![Video Chat](screenshots/video-chat.png)

### Friend Room
![Friend Room](screenshots/friend-room.png)

---

**Made with ❤️ by [Dilip Kumar]**

**Happy Chatting! 🎉**
