# WebRTC Live Voice & Video Call System

## Overview

This project is a **complete peer-to-peer voice and video calling system** built with WebRTC and Supabase Realtime signaling. Users can create rooms, share room codes, and connect for live video/audio calls directly in the browser.

## Project Purpose

A production-ready WebRTC calling system that demonstrates:
- Real-time peer-to-peer video/audio streaming
- Supabase Realtime for WebRTC signaling (Broadcast API)
- Multi-user room support with dynamic participant management
- Scalable architecture with clear migration path to SFU

## Current State

✅ **Fully functional and ready to use**
- Frontend: HTML/CSS/JS with beautiful glassy UI
- Backend: Node.js static server with environment variable injection
- Database: Supabase PostgreSQL with Realtime enabled
- Signaling: Supabase Realtime Broadcast for WebRTC
- Edge Function: Optional cleanup and stats endpoint
- Documentation: Comprehensive setup and test guides

## Recent Changes (Latest)

**2025-10-19:** Fixed connection stability and implemented automatic reconnection
- **CRITICAL FIX:** Resolved persistent disconnection issues
  - Calls no longer disconnect after a few seconds
  - Automatic reconnection with ICE restart when connections fail
  - Up to 5 reconnection attempts with exponential backoff
  - Proper handling of both temporary and permanent connection failures
- **NEW FEATURE:** ICE candidate buffering
  - Prevents loss of ICE candidates that arrive before remote description is set
  - Ensures reliable connection establishment in all network conditions
- **IMPROVED:** Connection state monitoring
  - Now monitors both `iceConnectionState` and `connectionState`
  - Better detection of connection issues
  - Detailed logging for debugging connection problems
- **IMPROVED:** Connection recovery logic
  - Graceful handling of temporary network interruptions
  - Automatic recovery from "disconnected" state (3-second wait before retry)
  - Immediate reconnection attempts for "failed" state
  - Visual feedback to users during reconnection attempts
- **IMPROVED:** Resource management
  - Proper cleanup of reconnection timers and buffers
  - No memory leaks from failed connections
  - Clean shutdown when leaving rooms

**2025-10-19:** Configured for GitHub Pages deployment
- **GitHub Pages Ready:** App now configured to deploy to https://cartier-app.github.io/webrtc/
- **Client-side configuration:** Created config.js for Supabase credentials (GitHub Pages is static-only)
- **Fixed postMessage origins:** Embed SDK now correctly normalizes origins for subdirectory paths
- **Improved error handling:** Shows clear error screen when Supabase credentials are missing
- **Deployment guides:** Comprehensive DEPLOY.md and README_GITHUB_PAGES.md with step-by-step instructions
- **Security documentation:** Clear guidance on RLS policies and public vs. private keys

**2025-10-19:** Added integration system for third-party embedding
- **NEW FEATURE:** Embeddable JavaScript SDK (embed.js)
  - Easy-to-use SDK for integrating video/audio calls into any website
  - Supports three modes: video-only, audio-only, or both
  - Multiple display options: inline, floating, or modal
  - Complete API for programmatic control
  - Event callbacks for join/leave/error handling
  - Cross-origin messaging for parent-iframe communication
- **NEW PAGE:** Integration documentation (integration.html)
  - Comprehensive guide with live examples
  - Code snippets for quick integration
  - Interactive demos for all three modes
  - Configuration options table
  - Use cases and best practices
- **NEW FEATURE:** Embed mode support in main application
  - URL parameter detection for embed mode
  - Streamlined UI for embedded contexts
  - Message passing between iframe and parent window
  - Auto-join capability for seamless integration
- **NEW FILE:** Example integration page (example-integration.html)
  - Working demo showing how to integrate the SDK
  - Interactive controls for testing all features
  - Real-time code examples
  - Mode switching demonstration
- **UPDATED:** Server configuration
  - Routes for integration pages
  - Environment variable injection for embed.js
  - Support for multiple entry points
- **UPDATED:** CSS styling
  - Embed-specific styles for compact display
  - Responsive design for embedded contexts
  - Clean, professional appearance in iframes

**2025-10-19:** Added real-time network quality indicators and professional UI redesign
- **NEW FEATURE:** Live Connection Health Monitor panel
  - **Prominent panel** positioned between video grid and participants section
  - Shows all users' connection quality in real-time with animated cards
  - Displays Packet Loss, Jitter, and RTT metrics for each user
  - Color-coded status badges (green/yellow/red) for Excellent/Fair/Poor
  - Animated signal bars that pulse based on connection quality
  - Updates every 1.5 seconds using WebRTC getStats() API
  - Cards appear/disappear automatically as users join/leave
- **ADDITIONAL:** Quality indicators also shown on video feed corners
- **UI REDESIGN:** Complete professional corporate redesign
  - Modern gradient background with smooth animations
  - Premium glass-morphism effects with backdrop blur
  - Professional color scheme (blues, purples, whites)
  - Enhanced typography and spacing
  - Improved participant count display
  - Smooth animations and transitions throughout
  - Responsive design for all screen sizes
- **IMPROVED:** Real-time participant tracking
  - Participant list updates instantly when users join/leave
  - Animated badges with smooth transitions
  - Accurate participant count always visible

**2025-10-19:** Fixed video display issue between users
- **CRITICAL FIX:** Resolved issue where users could hear but not see each other
- Problem: WebRTC's ontrack event fires separately for audio and video tracks
- Solution: Added remoteStreams Map to properly aggregate tracks per peer
- Audio was working (single track handled correctly)
- Video now works (both tracks properly combined into single MediaStream)
- All users can now see and hear each other correctly

**2025-10-19:** Initial project setup
- Created complete WebRTC calling system
- Implemented Supabase Realtime signaling
- Built responsive UI with animated background
- Added comprehensive documentation
- Configured Node.js server with environment variables
- Set up workflow for automatic deployment

## Architecture

### Frontend (Client-Side)
- **index.html** - Main UI with room controls and video grid
- **style.css** - Glassy animated pink/white theme
- **script.js** - WebRTC logic + Supabase Realtime integration

### Backend (Server-Side)
- **server.js** - Static file server with env var injection
- **Supabase Database** - Rooms and participants tracking
- **Supabase Realtime** - WebRTC signaling via Broadcast

### Database Schema
- **rooms** - Active call rooms with codes
- **participants** - Users in each room with presence
- **signaling_messages** - Optional persistent signaling

## Project Structure

```
├── index.html              # Main application UI
├── style.css              # Animated glassy styling
├── script.js              # WebRTC + Supabase client logic
├── server.js              # Node.js static server
├── embed.js               # Embeddable JavaScript SDK
├── integration.html       # Integration guide & documentation
├── example-integration.html # Working integration example
├── setup.sql              # Supabase database schema
├── SETUP_GUIDE.md         # Complete setup walkthrough
├── TEST_FLOW.md           # Testing scenarios and examples
├── README.md              # Project overview
├── package.json           # Node.js dependencies
├── supabase/functions/
│   └── signaling/
│       └── index.ts       # Edge Function for cleanup
└── replit.md              # This file
```

## Technology Stack

- **WebRTC** - Native browser peer-to-peer streaming
- **Supabase** - PostgreSQL database + Realtime signaling
- **Node.js** - Static file server
- **Vanilla JavaScript** - No frameworks, pure JS
- **HTML5/CSS3** - Responsive design with animations

## User Preferences

### Development
- Keep code simple and well-commented
- Use vanilla JS (no frameworks) for portability
- Prioritize performance and low latency
- Follow WebRTC best practices

### Design
- Modern glassy UI with backdrop blur
- Animated gradient background (pink/white theme)
- Responsive grid layout for videos
- Clear visual feedback for actions

## Environment Variables

**Required:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Note:** These are injected into script.js by server.js at runtime

## Capacity & Scaling

### Current (Peer-to-Peer)
- **Voice calls:** 5-10 users comfortably
- **Video calls:** 3-5 users (bandwidth dependent)
- Mesh topology: Each peer connects to all others

### Scaling Path
For 10+ users, migrate to SFU:
1. **LiveKit** - Easiest, managed option available
2. **mediasoup** - Best performance (C++, 500+ consumers/core)
3. **Managed services** - Agora, Twilio, Daily.co

See SETUP_GUIDE.md for migration details.

## Key Features

✨ **Implemented:**
- Create/join rooms with unique codes
- Real-time video/audio streaming
- Toggle video/audio during calls
- Participant presence tracking
- Automatic cleanup of inactive users
- Room code sharing
- Responsive mobile UI
- Cross-browser support
- Beautiful animated UI
- **Embeddable SDK for third-party integration**
- **Multiple integration modes (video-only, audio-only, both)**
- **Comprehensive integration documentation**
- **Live demo examples**

🚧 **Future Enhancements:**
- User authentication
- Room passwords
- Screen sharing
- Recording functionality
- Chat messaging
- Virtual backgrounds
- SFU migration for scaling

## Deployment

### Current Environment: Replit
- Workflow: `WebRTC Server` on port 5000
- Automatically serves frontend with env var injection
- Access via Replit URL

### GitHub Pages Deployment (Recommended)
**Live URL:** https://cartier-app.github.io/webrtc/

**Quick Start:**
1. Edit `config.js` with your Supabase credentials
2. Push to GitHub
3. Enable GitHub Pages in repository settings
4. App goes live automatically

See [DEPLOY.md](DEPLOY.md) for detailed instructions.

### Other Production Deployments
1. Run `setup.sql` in Supabase SQL Editor
2. Enable Realtime for database tables
3. Configure Supabase credentials in config.js
4. Deploy to Vercel/Netlify/GitHub Pages
5. (Optional) Deploy Edge Function to Supabase

## Documentation

- **[README.md](README.md)** - Quick overview and features
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[TEST_FLOW.md](TEST_FLOW.md)** - Test scenarios and examples
- **[setup.sql](setup.sql)** - Database schema with comments

## Testing

### Quick Test
1. Open app in two browser tabs
2. Create room in Tab 1, note room code
3. Join room in Tab 2 with same code
4. Verify video/audio connection

See TEST_FLOW.md for comprehensive testing scenarios.

## Troubleshooting

### Common Issues
- **No camera/mic:** Grant browser permissions, use HTTPS/localhost
- **Connection fails:** Check Supabase Realtime is enabled
- **Poor quality:** Reduce video resolution or participant count
- **NAT issues:** Add TURN servers for restrictive networks

See SETUP_GUIDE.md troubleshooting section for details.

## Security Notes

**Current setup (Development):**
- Anonymous access for quick testing
- Public room codes
- No authentication required

**Production recommendations:**
- Enable Supabase Auth
- Add password protection
- Implement rate limiting
- Use TURN servers with authentication

## Browser Support

✅ **Supported:**
- Chrome 74+ (recommended)
- Firefox 66+
- Safari 12.1+
- Edge 79+

❌ **Not supported:**
- Internet Explorer
- Older mobile browsers

## Performance

### Bandwidth Requirements
- **Audio only:** ~64 kbps per connection
- **720p video:** ~2 Mbps per connection
- **1080p video:** ~4 Mbps per connection

### Recommended
- **2 users:** Any modern connection
- **3-5 users:** 10+ Mbps upload/download
- **5-10 audio:** 5+ Mbps upload/download

## Database Management

### Cleanup
Run periodically in Supabase SQL Editor:

```sql
SELECT cleanup_old_signaling_messages();
SELECT cleanup_inactive_participants();
```

### Monitoring
Check active rooms and participants in Supabase dashboard.

## Dependencies

### Runtime
- Node.js 20+ (for server)
- Modern browser with WebRTC support

### External Services
- Supabase account (free tier sufficient for testing)
- STUN servers (Google's public STUN used)
- (Optional) TURN servers for production

## License

MIT License - Free to use and modify

## Support Resources

- Supabase Docs: https://supabase.com/docs
- WebRTC Guide: https://webrtc.org
- MDN WebRTC: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

## Development Notes

### Code Style
- Clear variable names
- Comprehensive comments
- Error handling throughout
- Async/await for promises
- Event-driven architecture

### WebRTC Flow
1. Get user media (camera/mic)
2. Create RTCPeerConnection
3. Exchange SDP offers/answers via Supabase
4. Exchange ICE candidates via Supabase
5. Direct P2P connection established
6. Media streams between browsers

### Supabase Realtime
- Uses Broadcast API for ephemeral signaling
- Database tables for persistent state
- Presence tracking via participant updates
- Automatic WebSocket management

## Contact & Contribution

This is a demonstration project. Feel free to fork, modify, and use for your own projects.

---

**Status:** ✅ Production-ready for small groups (2-10 users)
**Last Updated:** October 19, 2025
