# 🧪 Test Flow & Example Scenarios

This document provides step-by-step test flows to verify your WebRTC video call system is working correctly.

---

## 🎯 Quick Test (2 Users)

### Scenario: Alice creates a room, Bob joins

#### Step 1: Alice Creates a Room

1. Open the application in **Browser Tab 1** (or Device 1)
2. Fill in the form:
   - **Your Name:** `Alice`
   - **Room Code:** Leave empty
   - ✅ **Enable Video:** Checked
   - ✅ **Enable Audio:** Checked
3. Click **"Create New Room"**
4. Grant camera/microphone permissions when prompted
5. Note the **room code** displayed (e.g., `ABC123`)
6. You should see:
   - Your own video feed (labeled "You")
   - Participant count: `1 participants`
   - Your name in the participants list

#### Step 2: Bob Joins the Room

1. Open the application in **Browser Tab 2** (or Device 2)
   - **Tip:** Use incognito/private mode for testing locally
2. Fill in the form:
   - **Your Name:** `Bob`
   - **Room Code:** `ABC123` (the code from Step 1)
   - ✅ **Enable Video:** Checked
   - ✅ **Enable Audio:** Checked
3. Click **"Join Room"**
4. Grant camera/microphone permissions when prompted

#### Step 3: Verify Connection

**On Alice's screen:**
- Should see Bob's video feed appear (labeled "Bob")
- Participant count updates to: `2 participants`
- Status notification: "Bob joined"
- Can hear Bob's audio

**On Bob's screen:**
- Should see Alice's video feed appear (labeled "Alice")
- Participant count: `2 participants`
- Can hear Alice's audio

#### Step 4: Test Controls

**Alice toggles her video off:**
1. Click the video button (📹)
2. Alice's video should disappear on both screens
3. Bob still sees Alice's participant badge

**Bob toggles his audio off:**
1. Click the microphone button (🎤)
2. Bob's audio should be muted
3. Alice can no longer hear Bob

**Toggle back on to verify it works**

#### Step 5: Leave Room

**Bob leaves:**
1. Click **"Leave Room"**
2. Bob returns to setup screen
3. On Alice's screen:
   - Bob's video disappears
   - Participant count updates to: `1 participants`
   - Status notification: "Bob left"

**Alice leaves:**
1. Click **"Leave Room"**
2. Returns to setup screen

---

## 👥 Multi-User Test (3-5 Users)

### Scenario: Group video call

#### Setup

1. **User 1 (Host):**
   - Name: `Alice`
   - Create new room
   - Note room code: `XYZ789`

2. **User 2:**
   - Name: `Bob`
   - Join room: `XYZ789`

3. **User 3:**
   - Name: `Charlie`
   - Join room: `XYZ789`

4. **User 4:**
   - Name: `Diana`
   - Join room: `XYZ789`

5. **User 5:**
   - Name: `Eve`
   - Join room: `XYZ789`

#### Expected Results

- All users see 5 video feeds (including their own)
- Participant count shows: `5 participants`
- All users can hear each other
- Video grid auto-layouts to fit all participants

#### Performance Notes

- **3 users:** Smooth, no issues
- **4 users:** Smooth on good internet
- **5 users:** May see slight lag on slower connections
- **6+ users:** Video quality may degrade (P2P limitation)

---

## 🎤 Audio-Only Test (5-10 Users)

### Scenario: Voice conference call

#### Setup

All users:
- Uncheck **"Enable Video"** ✅→❌
- Keep **"Enable Audio"** checked ✅

#### Steps

1. **Host creates room** (video disabled)
2. **9 users join** with audio only
3. Everyone can hear everyone else
4. Lower bandwidth = supports more users

#### Expected Results

- No video feeds shown
- Participant badges show all 10 users
- Clear audio for all participants
- More stable than video (less bandwidth)

#### Capacity Test

- **Up to 10 users:** Should work smoothly
- **Beyond 10 users:** May experience audio quality issues

---

## 📱 Mobile Test

### Scenario: Mobile device joining desktop call

#### Setup

1. **Desktop:** Alice creates room `MOB123`
2. **Mobile:** Bob joins via smartphone

#### Steps

1. Open app on mobile browser (Chrome/Safari)
2. Enter room code `MOB123`
3. Grant permissions (camera/microphone)
4. Test video/audio

#### Expected Results

- Mobile video displays correctly
- Desktop sees mobile feed
- Responsive UI adjusts for mobile screen
- Controls accessible on mobile

#### Troubleshooting

- If permissions fail, check browser settings
- Some mobile browsers require HTTPS
- Test in both portrait and landscape mode

---

## 🔄 Reconnection Test

### Scenario: Handle network interruption

#### Steps

1. Alice and Bob in active call
2. **Simulate disconnect:**
   - Close browser tab (Bob)
   - Or disconnect WiFi briefly
3. **Reconnect:**
   - Bob reopens app
   - Joins same room code
4. **Verify:**
   - Connection re-establishes
   - Video/audio resumes

#### Expected Results

- Automatic cleanup of old participant record
- New connection established
- Status shows "Bob joined"

---

## 🌐 Cross-Browser Test

### Scenario: Different browsers in same room

#### Setup

1. **Chrome:** Alice creates room
2. **Firefox:** Bob joins
3. **Safari:** Charlie joins
4. **Edge:** Diana joins

#### Expected Results

- All browsers connect successfully
- Cross-browser WebRTC compatibility works
- Slight differences in video quality acceptable

#### Notes

- Safari may ask for permissions differently
- Firefox has excellent WebRTC support
- Chrome/Edge use same engine (Chromium)

---

## 🚨 Error Scenarios

### Test 1: Invalid Room Code

**Steps:**
1. Try to join room: `INVALID`

**Expected:**
- Error: "Room not found or is no longer active"
- Stays on setup screen
- Can try again with valid code

### Test 2: No Camera Permission

**Steps:**
1. Deny camera permission
2. Try to create/join room

**Expected:**
- Error: "Could not access camera/microphone"
- Helpful error message
- Can retry after granting permissions

### Test 3: Empty Name

**Steps:**
1. Leave name field empty
2. Try to create room

**Expected:**
- Error: "Please enter your name"
- Form validation prevents submission

### Test 4: Network Failure

**Steps:**
1. Disconnect internet during call

**Expected:**
- Ice connection state changes to "failed"
- Peer connections close after timeout
- Can reconnect when internet restored

---

## 📊 Performance Testing

### Bandwidth Test

**Scenario:** Measure bandwidth usage

#### 2-Person Video Call

**Expected Bandwidth:**
- Upload: ~2-3 Mbps (720p video)
- Download: ~2-3 Mbps
- Total: ~5 Mbps

#### 5-Person Video Call

**Expected Bandwidth:**
- Upload: ~8-10 Mbps (4 streams × 2 Mbps)
- Download: ~8-10 Mbps
- Total: ~18 Mbps

**Tool:** Use browser DevTools → Network tab to monitor

### CPU/Memory Test

**Monitor:**
- Chrome Task Manager (Shift+Esc)
- Browser DevTools → Performance

**Expected:**
- 2 users: Low CPU (~10-20%)
- 5 users: Medium CPU (~30-50%)
- 10 users audio: Medium CPU (~40%)

---

## 🔍 Database Verification

### Check Supabase Dashboard

After creating/joining rooms:

#### 1. Verify Rooms Table

```sql
SELECT * FROM rooms ORDER BY created_at DESC LIMIT 5;
```

**Expected:** See your room with correct `room_code`

#### 2. Verify Participants Table

```sql
SELECT * FROM participants WHERE room_id = '<your-room-id>';
```

**Expected:** See all active participants

#### 3. Check Signaling Messages (Optional)

```sql
SELECT COUNT(*) FROM signaling_messages;
```

**Note:** Messages may be empty if using Broadcast (which is recommended)

---

## 🎭 Edge Cases

### Case 1: Same User, Multiple Tabs

**Steps:**
1. Alice creates room in Tab 1
2. Alice joins same room in Tab 2

**Expected:**
- Two separate peer IDs
- Alice sees herself twice
- Works but not recommended

### Case 2: Room Code Reuse

**Steps:**
1. Create room: `TEST1`
2. Everyone leaves
3. Try to create new room with code: `TEST1`

**Expected:**
- New room created (different ID)
- Or error if code collision (unlikely with random generation)

### Case 3: Maximum Participants

**Steps:**
1. Fill room with 10 participants
2. Try to join as 11th user

**Current Behavior:**
- Allows joining (no limit enforced in code yet)
- Performance degrades

**Improvement:** Add max participant check

---

## ✅ Acceptance Criteria

### Minimum Viable Product (MVP)

- ✅ 2 users can video call
- ✅ Room code sharing works
- ✅ Audio/video toggle works
- ✅ Participants list updates
- ✅ Clean leave/disconnect
- ✅ Works on Chrome/Firefox/Safari

### Production Ready

- ✅ All MVP features
- ✅ Handles 5 concurrent users
- ✅ Mobile responsive
- ✅ Error handling robust
- ✅ TURN servers for NAT traversal
- ✅ Authentication enabled
- ✅ Analytics tracking

---

## 🐛 Common Issues & Solutions

### Issue: "No video appears"

**Check:**
1. Camera permissions granted?
2. Browser console for errors?
3. Is HTTPS or localhost?
4. Try different browser

### Issue: "Audio echo/feedback"

**Solution:**
- Use headphones
- Mute when not speaking
- Reduce speaker volume

### Issue: "Laggy video"

**Solutions:**
- Reduce video resolution
- Limit participants
- Check internet speed
- Close other apps

### Issue: "Can't connect to peer"

**Check:**
1. Firewall blocking WebRTC?
2. NAT type restrictive?
3. Need TURN server?
4. Supabase Realtime enabled?

---

## 📝 Test Checklist

Before deploying to production:

- [ ] 2-user video call works
- [ ] 2-user audio call works
- [ ] 5-user video call tested
- [ ] 10-user audio call tested
- [ ] Mobile browser tested
- [ ] Cross-browser tested
- [ ] Room creation works
- [ ] Room joining works
- [ ] Video toggle works
- [ ] Audio toggle works
- [ ] Participants list accurate
- [ ] Leave room works cleanly
- [ ] Reconnection works
- [ ] Error messages helpful
- [ ] Database records correct
- [ ] No memory leaks
- [ ] Performance acceptable
- [ ] UI responsive

---

## 🎉 Success Metrics

**Your system is working if:**

1. ✅ Two users can see and hear each other
2. ✅ Video/audio quality is acceptable
3. ✅ Connections establish within 5 seconds
4. ✅ UI is responsive and intuitive
5. ✅ No errors in console
6. ✅ Clean disconnects without crashes
7. ✅ Works across different networks
8. ✅ Mobile experience is usable

---

## 🚀 Next Steps After Testing

1. **Performance Testing:**
   - Use tools like WebRTC Internals (chrome://webrtc-internals)
   - Monitor bandwidth, packet loss, jitter

2. **Security Hardening:**
   - Add authentication
   - Implement rate limiting
   - Add room passwords

3. **Scaling Preparation:**
   - Test with max expected users
   - Plan SFU migration if needed
   - Set up monitoring/analytics

4. **User Testing:**
   - Get feedback from real users
   - Identify pain points
   - Iterate on UX

---

**Happy Testing! 🎊**

If all tests pass, your WebRTC system is ready for production deployment!
