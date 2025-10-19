# TURN Server Configuration Guide

## What are TURN Servers?

**TURN (Traversal Using Relays around NAT)** servers are relay servers that help establish WebRTC connections when direct peer-to-peer connections fail due to restrictive firewalls or symmetric NATs.

## Current Setup

This project is configured with **free public TURN servers** provided by Open Relay Project (metered.ca):

```javascript
{
  urls: 'turn:openrelay.metered.ca:80',
  username: 'openrelayproject',
  credential: 'openrelayproject'
}
```

### ✅ Pros
- Free to use
- No signup required
- Works for testing and small projects
- Supports UDP, TCP, and TLS

### ⚠️ Limitations
- Shared infrastructure (variable performance)
- No SLA or uptime guarantee
- May have rate limiting
- Not suitable for production at scale

---

## When Do You Need TURN?

WebRTC connections fail without TURN in these scenarios:

| Network Type | Direct P2P | Needs TURN |
|--------------|------------|------------|
| **Open internet** | ✅ Yes | ❌ No |
| **Behind home router** | ✅ Usually | ❌ Usually no |
| **Corporate firewall** | ❌ Often fails | ✅ Yes |
| **Symmetric NAT** | ❌ Fails | ✅ Yes |
| **Mobile carrier NAT** | ⚠️ Sometimes | ✅ Recommended |

**Statistics:** ~15-20% of connections require TURN relay in real-world usage.

---

## Production TURN Solutions

### Option 1: Managed TURN Services (Recommended)

#### **Twilio Network Traversal Service**
- **Cost:** Pay-per-GB (~$0.40/GB)
- **Pros:** Highly reliable, global infrastructure, automatic failover
- **Setup:** https://www.twilio.com/docs/stun-turn

```javascript
// Get credentials from Twilio API
const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Tokens.json', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa('YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN')
  }
});
const data = await response.json();

const ICE_SERVERS = {
  iceServers: data.ice_servers
};
```

#### **Xirsys**
- **Cost:** Free tier (5GB/month), then $10-$50/month
- **Pros:** WebRTC-specific, dashboard analytics
- **Setup:** https://xirsys.com

#### **Cloudflare Calls TURN**
- **Cost:** Included with Cloudflare Calls (pay per minute)
- **Pros:** Global edge network, DDoS protection
- **Setup:** https://developers.cloudflare.com/calls/

---

### Option 2: Self-Hosted TURN Server

#### **coturn** (Most Popular)

**Pros:**
- Free and open source
- Battle-tested
- Full control

**Cons:**
- Requires server maintenance
- Need to configure firewall rules
- Bandwidth costs

**Installation (Ubuntu/Debian):**

```bash
sudo apt-get update
sudo apt-get install coturn

sudo nano /etc/turnserver.conf
```

**Configuration:**

```conf
listening-port=3478
tls-listening-port=5349

external-ip=YOUR_SERVER_PUBLIC_IP

realm=yourdomain.com
server-name=turn.yourdomain.com

lt-cred-mech
user=username:password

fingerprint
verbose
```

**Start coturn:**

```bash
sudo systemctl start coturn
sudo systemctl enable coturn
```

**Update your WebRTC config:**

```javascript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:turn.yourdomain.com:3478',
      username: 'username',
      credential: 'password'
    },
    {
      urls: 'turn:turn.yourdomain.com:5349?transport=tcp',
      username: 'username',
      credential: 'password'
    }
  ]
};
```

**Firewall Rules:**

```bash
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 49152:65535/udp  # TURN relay ports
```

---

## Security Best Practices

### 1. Use Time-Limited Credentials

Generate temporary credentials with expiration:

```javascript
// Server-side (Node.js example)
const crypto = require('crypto');

function generateTurnCredentials(username, secret, ttl = 86400) {
  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  const turnUsername = `${timestamp}:${username}`;
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(turnUsername);
  const turnPassword = hmac.digest('base64');
  
  return {
    username: turnUsername,
    password: turnPassword,
    ttl: timestamp
  };
}

const creds = generateTurnCredentials('user123', 'your-secret-key');
```

### 2. Rotate Credentials Regularly

- Change TURN passwords monthly
- Use different credentials per deployment
- Monitor for unusual bandwidth usage

### 3. Restrict Access

- Whitelist IP ranges if possible
- Implement rate limiting
- Monitor concurrent connections

---

## Testing Your TURN Server

### Tool 1: Trickle ICE

1. Visit: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
2. Add your TURN server configuration
3. Click "Gather candidates"
4. Look for `relay` type candidates

**Expected output:**
```
candidate:... typ relay raddr ... rport ... generation 0 ufrag ...
```

### Tool 2: Command Line (Linux/Mac)

```bash
turnutils_uclient -v -u username -w password turn:your-turn-server.com:3478
```

### Tool 3: Browser Console

```javascript
const pc = new RTCPeerConnection({
  iceServers: [
    { 
      urls: 'turn:your-server.com:3478',
      username: 'test',
      credential: 'test123'
    }
  ]
});

pc.onicecandidate = (event) => {
  if (event.candidate) {
    console.log('Candidate type:', event.candidate.type);
  }
};

pc.createOffer().then(offer => pc.setLocalDescription(offer));
```

Look for `type: "relay"` in the output.

---

## Cost Estimation

### Bandwidth Usage Examples

**2-person video call (30 min):**
- Audio: ~23 MB per person
- 720p video: ~450 MB per person
- **Total TURN relay (if used):** ~900 MB

**5-person video call (1 hour):**
- Each person sends 4 streams + receives 4 streams
- **Estimated:** 5-7 GB total through TURN (if all connections relay)

### Monthly Cost Estimates

| Service | 100GB/mo | 500GB/mo | 1TB/mo |
|---------|----------|----------|--------|
| **Twilio** | $40 | $200 | $400 |
| **Xirsys** | $10-20 | $40-60 | $80-100 |
| **Self-hosted** | VPS: $10-20 | VPS: $20-40 | Dedicated: $50-100 |
| **Open Relay** | Free (limited) | N/A | N/A |

**Note:** Most connections use STUN only (~80%), so actual TURN bandwidth is ~20% of total.

---

## Recommended Setup by Scale

### Small Projects (<50 users)
✅ Use **Open Relay Project** (current setup)
- Free
- Good enough for testing
- Replace for production

### Medium Projects (50-500 concurrent)
✅ Use **Xirsys** or **self-hosted coturn**
- Predictable costs
- Better reliability
- Dedicated infrastructure

### Large Projects (500+ concurrent)
✅ Use **Twilio** or **Cloudflare Calls**
- Enterprise SLA
- Global infrastructure
- Automatic scaling

---

## Migration Guide

### Upgrading from Open Relay to Twilio

1. **Sign up for Twilio:** https://www.twilio.com/console
2. **Get credentials** from Twilio API (see code above)
3. **Update script.js:**

```javascript
// Remove Open Relay servers
// Add Twilio servers dynamically

async function getIceServers() {
  const response = await fetch('/api/ice-servers'); // Your backend endpoint
  const data = await response.json();
  return data.iceServers;
}

// In createPeerConnection:
const iceServers = await getIceServers();
const pc = new RTCPeerConnection({ iceServers });
```

4. **Create backend endpoint** to fetch Twilio credentials
5. **Test thoroughly** before going live

---

## Monitoring & Analytics

### What to Track

- **Connection success rate** - % of calls that establish
- **TURN usage rate** - % of connections requiring TURN
- **Bandwidth usage** - GB transferred through TURN
- **Latency** - Round-trip time for TURN relay
- **Geographic distribution** - Where users are connecting from

### Tools

- **Twilio Console** - Built-in analytics
- **WebRTC Stats** - chrome://webrtc-internals
- **Custom logging:**

```javascript
pc.onicecandidate = (event) => {
  if (event.candidate) {
    // Log to your analytics
    analytics.track('ICE Candidate', {
      type: event.candidate.type,
      protocol: event.candidate.protocol
    });
  }
};
```

---

## Troubleshooting

### TURN Server Not Working

1. **Check firewall:**
   ```bash
   sudo ufw status
   ```

2. **Verify TURN is listening:**
   ```bash
   sudo netstat -tulpn | grep turnserver
   ```

3. **Test with telnet:**
   ```bash
   telnet your-server.com 3478
   ```

4. **Check coturn logs:**
   ```bash
   sudo journalctl -u coturn -f
   ```

### High Latency

- Move TURN server closer to users
- Use multiple TURN servers globally
- Upgrade server bandwidth
- Consider managed service with CDN

---

## Summary

✅ **Current setup:** Free public TURN (good for testing)  
🔄 **Next step:** Choose production TURN based on scale  
📊 **Monitor:** Track TURN usage rate and bandwidth  
💰 **Budget:** $10-100/month depending on usage  

For most projects starting out, the current Open Relay setup is fine. Upgrade to Twilio or self-hosted coturn when you're ready for production.

---

**Resources:**
- coturn: https://github.com/coturn/coturn
- Twilio TURN: https://www.twilio.com/docs/stun-turn
- Xirsys: https://xirsys.com
- Trickle ICE Test: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
