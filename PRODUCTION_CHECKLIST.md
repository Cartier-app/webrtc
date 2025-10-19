# Production Deployment Checklist

Before deploying this WebRTC system to production, complete these critical steps.

---

## 🔴 Critical (Must Complete)

### 1. TURN Server Configuration

**Current Status:** ⚠️ Using free public TURN servers (Open Relay)

**Action Required:**
- [ ] Choose a production TURN provider:
  - **Recommended:** Twilio Network Traversal Service
  - **Alternative:** Self-hosted coturn
  - **Alternative:** Xirsys, Cloudflare Calls
- [ ] Update `ICE_SERVERS` configuration in `script.js`
- [ ] Implement time-limited credentials (rotate every 24 hours)
- [ ] Test TURN connectivity with Trickle ICE tool

**Why:** Public TURN servers have no SLA and may be unreliable. Production apps need guaranteed NAT traversal.

**See:** `TURN_SERVERS.md` for detailed setup instructions

---

### 2. Supabase Database Setup

**Action Required:**
- [ ] Run `setup.sql` in your Supabase SQL Editor
- [ ] Enable Realtime for tables: `rooms`, `participants`, `signaling_messages`
- [ ] Verify RLS policies are active
- [ ] Test database connection from frontend

**Verify:**
```sql
SELECT * FROM rooms LIMIT 1;
SELECT * FROM participants LIMIT 1;
```

---

### 3. Environment Variables

**Action Required:**
- [ ] Set `SUPABASE_URL` in production environment
- [ ] Set `SUPABASE_ANON_KEY` in production environment
- [ ] Verify env vars are injected correctly by server.js

**Test:**
- Open browser console
- Check for "Failed to fetch" errors
- Verify Supabase client connects

---

### 4. HTTPS/SSL Configuration

**Current Status:** ⚠️ WebRTC requires secure context

**Action Required:**
- [ ] Ensure production URL uses HTTPS
- [ ] Obtain SSL certificate (Let's Encrypt, Cloudflare, etc.)
- [ ] Test camera/microphone permissions work

**Why:** Browsers block camera/mic access on non-HTTPS sites (except localhost)

---

## 🟡 Important (Strongly Recommended)

### 5. Authentication

**Current Status:** ⚠️ Anonymous access enabled

**Action Required:**
- [ ] Enable Supabase Auth
- [ ] Add login/signup flow
- [ ] Update RLS policies to require `auth.uid()`
- [ ] Restrict room creation to authenticated users

**Example RLS Policy:**
```sql
CREATE POLICY "Authenticated users only"
  ON rooms FOR ALL
  TO authenticated
  USING (true);
```

---

### 6. Rate Limiting

**Action Required:**
- [ ] Implement rate limiting on room creation
- [ ] Limit participants per room (currently 10)
- [ ] Add cooldown between room joins
- [ ] Monitor for abuse

**Suggested Limits:**
- Max 5 rooms created per user per hour
- Max 10 participants per room
- Max 3 concurrent rooms per user

---

### 7. Monitoring & Analytics

**Action Required:**
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor connection success rate
- [ ] Track TURN usage percentage
- [ ] Alert on failed connections >10%

**Key Metrics:**
- Connection establishment time
- ICE connection failures
- Bandwidth usage
- Active users/rooms

---

### 8. Cleanup Automation

**Current Status:** ✅ Client-side cleanup implemented

**Additional Actions:**
- [ ] Set up Supabase cron job for cleanup (optional)
- [ ] Monitor stale participant records
- [ ] Archive old rooms periodically

**Supabase Cron (Optional):**
```sql
SELECT cron.schedule(
  'cleanup-stale-participants',
  '*/5 * * * *',
  'SELECT cleanup_inactive_participants()'
);
```

---

## 🟢 Optional (Nice to Have)

### 9. Performance Optimization

- [ ] Enable video simulcast for adaptive quality
- [ ] Add bandwidth detection
- [ ] Implement quality presets (low/medium/high)
- [ ] Add network quality indicator

---

### 10. User Experience

- [ ] Add waiting room
- [ ] Show connection status indicators
- [ ] Display network quality warnings
- [ ] Add reconnection logic
- [ ] Show "user is typing" indicators

---

### 11. Security Hardening

- [ ] Add room passwords
- [ ] Implement room expiration (auto-close after X hours)
- [ ] Add participant kick/mute controls
- [ ] Enable host-only permissions
- [ ] Add content moderation

---

### 12. Scalability Preparation

**When to Act:** If you expect >10 concurrent users in a room

- [ ] Research SFU solutions (LiveKit, mediasoup)
- [ ] Plan migration path from P2P to SFU
- [ ] Budget for infrastructure costs
- [ ] Test with expected user load

**See:** `SETUP_GUIDE.md` section on scaling

---

## Testing Checklist

### Pre-Deployment Tests

- [ ] 2-user video call works smoothly
- [ ] 5-user video call tested
- [ ] 10-user audio call tested
- [ ] Mobile browser tested (iOS Safari, Android Chrome)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Connection recovery after network drop tested
- [ ] Tab close cleanup verified
- [ ] Room code sharing works
- [ ] Video/audio toggle works
- [ ] No console errors
- [ ] No memory leaks after 30+ min call

### TURN Server Tests

- [ ] Test with Trickle ICE tool
- [ ] Verify relay candidates appear
- [ ] Test from corporate network
- [ ] Test from mobile carrier network
- [ ] Monitor TURN bandwidth usage

### Load Testing

- [ ] Simulate 10 concurrent 2-user calls
- [ ] Simulate 5 concurrent 5-user calls
- [ ] Monitor CPU/memory usage
- [ ] Check database query performance
- [ ] Verify cleanup removes stale records

---

## Deployment Steps

### 1. Deploy Frontend

**Option A: Vercel**
```bash
npm install -g vercel
vercel
```

**Option B: Netlify**
```bash
npm install -g netlify-cli
netlify deploy
```

**Option C: Self-hosted**
```bash
node server.js
# Or use PM2 for process management
pm2 start server.js --name "webrtc-app"
```

### 2. Configure Environment

```bash
# Set production env vars
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Deploy Edge Function (Optional)

```bash
supabase functions deploy signaling
```

### 4. Update DNS

- [ ] Point domain to deployment
- [ ] Verify SSL certificate
- [ ] Test HTTPS access

### 5. Monitor First Users

- [ ] Watch logs for errors
- [ ] Check connection success rate
- [ ] Monitor TURN usage
- [ ] Gather user feedback

---

## Post-Deployment Monitoring

### Daily Checks (First Week)

- [ ] Review error logs
- [ ] Check connection metrics
- [ ] Monitor TURN bandwidth costs
- [ ] Review user feedback

### Weekly Checks (Ongoing)

- [ ] Database cleanup verification
- [ ] TURN server uptime
- [ ] Peak concurrent users
- [ ] Cost analysis

### Monthly Reviews

- [ ] Security audit
- [ ] Performance optimization
- [ ] Cost optimization
- [ ] Feature requests prioritization

---

## Rollback Plan

If production deployment fails:

1. **Revert to previous version:**
   ```bash
   vercel rollback  # or netlify equivalent
   ```

2. **Check common issues:**
   - Environment variables correct?
   - Supabase Realtime enabled?
   - SSL certificate valid?
   - TURN servers accessible?

3. **Test in staging first** before re-deploying

---

## Cost Estimation

### Monthly Costs (Estimated)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Supabase** | Up to 500MB DB | $25/mo for Pro |
| **TURN (Twilio)** | N/A | ~$40 per 100GB |
| **Hosting (Vercel)** | Hobby free | $20/mo for Pro |
| **Domain** | N/A | ~$12/year |
| **SSL Certificate** | Free (Let's Encrypt) | Free |

**Total Estimated:**
- **Free tier:** $0/mo (limited to ~50 users, public TURN)
- **Small production:** $60-100/mo (500 users, managed TURN)
- **Medium production:** $200-500/mo (5000 users, dedicated TURN)

---

## Support Resources

- **Supabase Discord:** https://discord.supabase.com
- **WebRTC Slack:** https://webrtc.slack.com
- **Stack Overflow:** Tag `webrtc` + `supabase`

---

## Final Checklist

Before going live:

- [ ] All critical items completed
- [ ] All tests passing
- [ ] Monitoring set up
- [ ] Team trained on troubleshooting
- [ ] Rollback plan tested
- [ ] User documentation ready
- [ ] Support email/chat ready
- [ ] Legal: Privacy policy, Terms of Service

---

**🎉 Ready for Production?**

If all critical and important items are checked, you're ready to deploy!

**Still have questions?** See:
- `SETUP_GUIDE.md` - Setup instructions
- `TURN_SERVERS.md` - TURN configuration
- `TEST_FLOW.md` - Testing scenarios
- `README.md` - Project overview

---

**Good luck with your launch! 🚀**
