# 🎥 WebRTC Live Voice & Video Call System

A real-time peer-to-peer voice and video calling system built with **Supabase Realtime** for WebRTC signaling.

## ✨ Features

- 🎬 **HD Video Calls** - Support for 720p video streaming
- 🎤 **Crystal Clear Audio** - High-quality voice communication
- 👥 **Multi-User Rooms** - 5-10 users for voice, 3-5 for video
- 🔄 **Real-time Signaling** - Powered by Supabase Realtime Broadcast
- 🎨 **Beautiful UI** - Animated glassy pink/white background
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔐 **Secure P2P** - Direct browser-to-browser connections
- ⚡ **Instant Connect** - No downloads, just share a room code

## 🚀 Quick Start

### 1. Run the Application

Click the **Run** button above or visit the Replit URL.

### 2. Create a Room

1. Enter your name
2. Toggle video/audio as needed
3. Click **"Create New Room"**
4. Share the room code with others

### 3. Join a Room

1. Enter your name
2. Enter the room code
3. Click **"Join Room"**
4. Grant camera/microphone permissions

## 📁 Project Structure

```
.
├── index.html              # Main HTML file with UI
├── style.css              # Glassy animated styling
├── script.js              # WebRTC and Supabase logic
├── server.js              # Node.js static server
├── setup.sql              # Supabase database schema
├── SETUP_GUIDE.md         # Detailed setup instructions
├── supabase/
│   └── functions/
│       └── signaling/
│           └── index.ts   # Edge Function for cleanup
└── README.md              # This file
```

## 🔧 Technologies Used

- **WebRTC** - Peer-to-peer video/audio streaming
- **Supabase Realtime** - WebRTC signaling (Broadcast API)
- **Supabase Database** - Room and participant management
- **Vanilla JavaScript** - No frameworks, pure JS
- **Node.js** - Simple HTTP server

## 📊 Capacity & Scaling

### Current (Peer-to-Peer)

- ✅ **Voice Calls:** 5-10 users comfortably
- ✅ **Video Calls:** 3-5 users (depends on bandwidth)

Each participant connects directly to every other participant (mesh topology).

### Scaling Beyond P2P

For **10+ participants**, migrate to an SFU (Selective Forwarding Unit):

| Solution | Best For | Capacity |
|----------|----------|----------|
| **LiveKit** | Easy setup, managed option | Hundreds to thousands |
| **mediasoup** | Maximum performance | 500+ consumers/core |
| **Agora/Twilio** | No server management | Unlimited (pay-per-use) |

See `SETUP_GUIDE.md` for migration details.

## 🛠️ Setup Instructions

### Supabase Configuration

1. **Create Supabase Project** at [supabase.com](https://supabase.com)
2. **Run SQL Schema** from `setup.sql` in SQL Editor
3. **Enable Realtime** for tables: `rooms`, `participants`, `signaling_messages`
4. **Get Credentials** from Settings → API
5. **Add to Replit Secrets:**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

For detailed instructions, see **[SETUP_GUIDE.md](SETUP_GUIDE.md)**

## 🎨 UI Features

- **Animated Background** - Smooth gradient animation in pink/white
- **Glassy Cards** - Modern frosted glass effect with backdrop blur
- **Video Grid** - Auto-layout for multiple participants
- **Control Panel** - Toggle video/audio with visual feedback
- **Participant List** - Real-time display of connected users
- **Status Notifications** - Toast messages for events

## 🔒 Security Notes

**Current setup is for development/testing:**
- Anonymous access enabled
- No authentication required
- Public room codes

**For production:**
- Enable Supabase Auth
- Add password protection to rooms
- Implement rate limiting
- Use TURN servers for NAT traversal

See security section in `SETUP_GUIDE.md`.

## 🐛 Troubleshooting

### Camera/Mic Not Working
- Grant browser permissions
- Use HTTPS or localhost
- Check browser console for errors

### Participants Not Connecting
- Verify Supabase Realtime is enabled
- Check firewall/NAT settings
- May need TURN servers for restrictive networks

### Poor Video Quality
- Reduce resolution in `script.js`
- Limit number of participants
- Check network bandwidth

See full troubleshooting guide in `SETUP_GUIDE.md`.

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup walkthrough
- **[setup.sql](setup.sql)** - Database schema with comments
- **Code Comments** - Inline documentation in all files

## 🎯 How It Works

1. **Room Creation:** User creates room → stored in Supabase
2. **Join Room:** Other users join with room code
3. **Signaling:** Supabase Realtime Broadcast exchanges WebRTC offers/answers
4. **ICE Exchange:** Broadcast sends ICE candidates for NAT traversal
5. **P2P Connection:** Direct browser-to-browser media streams
6. **Real-time Updates:** Database tracks active participants

## 🌟 Example Use Cases

- **Team Meetings** - Remote collaboration (3-5 people)
- **Study Groups** - Virtual study sessions
- **Gaming Voice Chat** - In-game communication
- **Family Calls** - Connect with loved ones
- **Webinars** - Small interactive sessions
- **1-on-1 Calls** - Personal conversations

## 📦 Dependencies

### Frontend
- `@supabase/supabase-js` (via CDN)
- Native WebRTC APIs (built into browsers)

### Backend (Optional Edge Function)
- Deno runtime (Supabase)
- `@supabase/supabase-js` for Deno

## 🚀 Deployment Options

1. **Replit** - Already configured (just click Run)
2. **Vercel/Netlify** - Static hosting for frontend
3. **Self-hosted** - Node.js server included
4. **Supabase Edge Functions** - For backend logic

## 📝 Files to Configure

Before deploying:

1. ✅ Run `setup.sql` in Supabase SQL Editor
2. ✅ Add `SUPABASE_URL` to environment
3. ✅ Add `SUPABASE_ANON_KEY` to environment
4. ✅ Enable Realtime for database tables

## 💡 Tips

- Use headphones to prevent echo
- Test on multiple devices/browsers
- Start with audio-only for better stability
- Keep room codes short (6 chars) for easy sharing
- Monitor Supabase dashboard for active rooms

## 🔗 Useful Links

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [WebRTC MDN Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [LiveKit Scaling Guide](https://docs.livekit.io)

## 📄 License

MIT License - Free to use and modify

---

**Built with ❤️ using Supabase + WebRTC**

Need help? Check `SETUP_GUIDE.md` for detailed instructions!
