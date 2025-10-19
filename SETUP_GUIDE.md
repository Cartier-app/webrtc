# WebRTC Voice & Video Call Setup Guide
## Supabase + WebRTC Signaling System

This guide will walk you through setting up a complete peer-to-peer voice and video calling system using Supabase Realtime for WebRTC signaling.

---

## 🎯 Features

- ✅ **Peer-to-peer WebRTC** connections for voice and video calls
- ✅ **Supabase Realtime** for signaling (offers, answers, ICE candidates)
- ✅ **Dynamic room creation** with unique room codes
- ✅ **Multi-participant support** (5-10 users for voice, 3-5 for video)
- ✅ **Real-time participant tracking** with presence
- ✅ **Toggle video/audio** during calls
- ✅ **Automatic cleanup** of inactive participants
- ✅ **Beautiful glassy UI** with animated pink/white background

---

## 📋 Prerequisites

1. **Supabase Account** - Sign up at [supabase.com](https://supabase.com)
2. **Modern Browser** - Chrome, Firefox, Safari, or Edge with WebRTC support
3. **HTTPS or localhost** - WebRTC requires secure context

---

## 🚀 Step 1: Setup Supabase Database

### 1.1 Create a New Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **"New Project"**
3. Choose an organization and enter project details
4. Wait for the project to be ready (takes ~2 minutes)

### 1.2 Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `setup.sql` file
4. Paste it into the SQL editor
5. Click **"Run"** to execute the schema

This creates:
- `rooms` table - Stores active call rooms
- `participants` table - Tracks users in each room
- `signaling_messages` table - Stores WebRTC signaling data (optional)
- RLS policies for security
- Indexes for performance
- Cleanup functions

### 1.3 Enable Realtime

1. Go to **Database → Replication** in your Supabase dashboard
2. Enable replication for:
   - ✅ `rooms`
   - ✅ `participants`
   - ✅ `signaling_messages`

---

## 🔧 Step 2: Get Your Supabase Credentials

1. Go to **Settings → API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public API key** (starts with `eyJ...`)

### 2.1 Update Frontend Configuration

Edit `script.js` and replace the placeholder values at the top:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

---

## 🎨 Step 3: Deploy the Frontend

### Option A: Local Development

1. Simply open `index.html` in your browser
2. Or use a local server:

```bash
# Python 3
python -m http.server 5000

# Node.js (if you have http-server installed)
npx http-server -p 5000
```

3. Open `http://localhost:5000`

### Option B: Deploy to Replit

1. The files are already set up in this Replit project
2. Click the **"Run"** button
3. Your app will be available at the Replit URL

### Option C: Deploy to Vercel/Netlify

1. Push your code to GitHub
2. Connect to Vercel or Netlify
3. Deploy (no build step needed - it's static HTML)

---

## 📦 Step 4: Deploy Supabase Edge Function (Optional)

The Edge Function provides additional features like room cleanup and statistics.

### 4.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 4.2 Login to Supabase

```bash
supabase login
```

### 4.3 Link Your Project

```bash
supabase link --project-ref your-project-ref
```

### 4.4 Deploy the Function

```bash
supabase functions deploy signaling
```

### 4.5 Set Environment Variables

The function automatically has access to `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

---

## 🧪 Step 5: Test Your Setup

### Test Flow:

1. **Open the app** in your browser
2. **Create a Room:**
   - Enter your name (e.g., "Alice")
   - Check "Enable Video" and "Enable Audio"
   - Click **"Create New Room"**
   - You'll see a room code (e.g., `ABC123`)
   - Grant camera/microphone permissions when prompted

3. **Join from Another Device/Browser:**
   - Open the app in a new browser tab or different device
   - Enter a different name (e.g., "Bob")
   - Enter the room code from step 2
   - Click **"Join Room"**

4. **Verify Connection:**
   - You should see remote video/audio streams
   - Both participants should appear in the participants list
   - Test toggling video/audio with the controls

---

## 🎥 How It Works

### Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │◄───────►│   Supabase   │◄───────►│   Browser   │
│   (Alice)   │         │   Realtime   │         │    (Bob)    │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                         │
      │   1. Create Room       │                         │
      ├───────────────────────►│                         │
      │                        │                         │
      │                        │   2. Join Room          │
      │                        │◄────────────────────────┤
      │                        │                         │
      │   3. Broadcast Offer   │                         │
      ├───────────────────────►│                         │
      │                        │   4. Forward Offer      │
      │                        ├────────────────────────►│
      │                        │                         │
      │                        │   5. Broadcast Answer   │
      │                        │◄────────────────────────┤
      │   6. Forward Answer    │                         │
      ◄────────────────────────┤                         │
      │                        │                         │
      │   7. Exchange ICE Candidates via Broadcast       │
      ◄───────────────────────────────────────────────────►
      │                        │                         │
      │   8. Direct P2P Media Stream (after connection)  │
      ◄─────────────────────────────────────────────────►│
```

### Signaling Process

1. **Room Creation/Join:**
   - User creates/joins room → record in `rooms` and `participants` tables
   - Subscribe to Supabase Realtime channels

2. **WebRTC Signaling (via Supabase Broadcast):**
   - Peer A creates offer → broadcasts to room channel
   - Peer B receives offer → creates answer → broadcasts back
   - Both peers exchange ICE candidates via broadcast

3. **Media Connection:**
   - After signaling completes, WebRTC establishes direct peer-to-peer connection
   - Audio/video streams flow directly between browsers (not through Supabase)

4. **Participant Management:**
   - Database tracks active participants
   - Heartbeat updates keep connections alive
   - Automatic cleanup removes inactive users

---

## 📊 Scalability & Limitations

### Peer-to-Peer Limitations

**Voice Calls:**
- ✅ **Realistic: 5-10 participants**
- Each participant maintains connections to all others (mesh topology)
- Bandwidth = (N-1) × bitrate per participant
- Example: 10 users @ 64kbps audio = ~576 kbps upload required

**Video Calls:**
- ✅ **Realistic: 3-5 participants**
- Video requires significantly more bandwidth
- Example: 5 users @ 720p (2 Mbps) = ~8 Mbps upload required
- Most home connections struggle with >5 video participants

### When to Use SFU (Selective Forwarding Unit)

For **larger groups (>10 participants)**, peer-to-peer becomes impractical. Use an SFU:

#### Option 1: **LiveKit** (Recommended)
- **Language:** Go (easy deployment)
- **Pros:** Complete SDKs, managed cloud option, horizontal scaling
- **Cons:** Slightly lower performance than mediasoup
- **Setup:** https://docs.livekit.io
- **Capacity:** Hundreds to thousands with clustering

```bash
# Quick start with LiveKit
docker run --rm -p 7880:7880 livekit/livekit-server --dev
```

#### Option 2: **mediasoup**
- **Language:** C++ (maximum performance)
- **Pros:** 2x more efficient than LiveKit (~500 consumers per CPU core)
- **Cons:** Steeper learning curve, requires WebRTC expertise
- **Setup:** https://mediasoup.org
- **Best for:** Performance-critical, self-hosted solutions

#### Option 3: **Agora, Twilio, Daily.co** (Managed Services)
- Fully managed, pay-per-use
- No server management
- Best for quick production deployment

### Migration Path

1. **Start with P2P** (1-5 users) ← You are here
2. **Add SFU** when you need 10+ participants
3. **Use managed service** for global scale

---

## 🔧 Configuration Options

### Modify Max Participants

Edit `setup.sql`:

```sql
max_participants INTEGER DEFAULT 10  -- Change this value
```

### Change Video Quality

Edit `script.js`:

```javascript
const constraints = {
  video: { 
    width: 1280,  // Change resolution
    height: 720 
  },
  audio: true
};
```

Lower resolution = less bandwidth = more participants possible

### TURN Servers (Already Configured!)

✅ **Good news:** This project is pre-configured with **free public TURN servers** from Open Relay Project!

This means connections will work even behind restrictive firewalls and NATs. The current setup includes:

```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', ... },
    { urls: 'turn:openrelay.metered.ca:443', ... }
  ]
};
```

**For Production:** See `TURN_SERVERS.md` for:
- Upgrading to Twilio or Xirsys
- Self-hosting with coturn
- Cost estimation and monitoring
- Testing and troubleshooting

**Current setup is great for:**
- Testing and development
- Small projects (<50 concurrent users)
- Proof of concepts

**Upgrade when:**
- Going to production
- Need guaranteed uptime/SLA
- Supporting 100+ concurrent users

---

## 🐛 Troubleshooting

### "Could not access camera/microphone"
- Grant browser permissions for camera/microphone
- Ensure you're on HTTPS or localhost
- Check browser console for specific errors

### "Room not found"
- Verify the room code is correct (case-sensitive)
- Check that the room is still active in Supabase dashboard

### Video freezing or poor quality
- Reduce video resolution in constraints
- Check network bandwidth (run speed test)
- Reduce number of participants
- Consider adding TURN servers

### Participants not connecting
- Check browser console for WebRTC errors
- Verify Supabase Realtime is enabled for all tables
- Check firewall/NAT settings (may need TURN server)
- Verify both users are in the same room

### Database cleanup not working
- Run cleanup functions manually in SQL editor:
```sql
SELECT cleanup_old_signaling_messages();
SELECT cleanup_inactive_participants();
```

---

## 🔒 Security Considerations

### Current Setup (Development)
- Anonymous access allowed for quick testing
- RLS policies allow anyone to create/join rooms

### Production Recommendations

1. **Enable Supabase Auth:**
```javascript
// Require authentication
const { data: { user } } = await supabaseClient.auth.getUser();
if (!user) throw new Error('Not authenticated');
```

2. **Update RLS Policies:**
```sql
-- Only authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);
```

3. **Add Room Passwords:**
- Add `password_hash` column to `rooms` table
- Verify password before joining

4. **Rate Limiting:**
- Use Supabase Edge Functions with rate limiting
- Prevent spam room creation

5. **Monitor Usage:**
- Track active rooms and participants
- Set up alerts for unusual activity

---

## 📚 Resources

### Documentation
- **Supabase Realtime:** https://supabase.com/docs/guides/realtime
- **WebRTC API:** https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- **Supabase Broadcast:** https://supabase.com/docs/guides/realtime/broadcast

### Scaling Solutions
- **LiveKit:** https://livekit.io
- **mediasoup:** https://mediasoup.org
- **Agora:** https://www.agora.io
- **Daily.co:** https://www.daily.co

### WebRTC Learning
- **WebRTC for the Curious:** https://webrtcforthecurious.com
- **Google WebRTC Samples:** https://webrtc.github.io/samples/

---

## 🎉 Next Steps

1. ✅ **Test your setup** with multiple devices
2. 🎨 **Customize the UI** to match your brand
3. 🔐 **Add authentication** for production
4. 📱 **Make it mobile-responsive** (already partially done)
5. 🚀 **Deploy to production** when ready
6. 📊 **Monitor performance** and user experience

---

## 💡 Tips

- **Use headphones** to prevent audio feedback during testing
- **Test on different networks** (WiFi, cellular, VPN)
- **Start with audio-only** if video bandwidth is an issue
- **Keep room codes short** (6 characters) for easy sharing
- **Implement screen sharing** by adding display media capture

---

## 🆘 Support

If you run into issues:

1. Check browser console for errors
2. Verify Supabase dashboard for database records
3. Test with simplified setup (2 users, audio-only)
4. Review Supabase Realtime logs in dashboard

---

## 📝 License

This is a demonstration project. Feel free to use and modify for your needs.

---

**Built with ❤️ using Supabase + WebRTC**
