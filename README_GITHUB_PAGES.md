# CallConnect - GitHub Pages Deployment

🎉 **Your WebRTC video calling app is ready for GitHub Pages!**

## Quick Start

### 1. Add Your Supabase Credentials

```bash
cp config.example.js config.js
```

Edit `config.js` with your Supabase project URL and anonymous key.

### 2. Deploy to GitHub

```bash
git add .
git commit -m "Deploy CallConnect to GitHub Pages"
git push origin main
```

### 3. Enable GitHub Pages

1. Go to your repository Settings
2. Navigate to Pages section
3. Select branch: `main`, folder: `/ (root)`
4. Click Save

Your app will be live at: **https://cartier-app.github.io/webrtc/**

## Integration URLs

Once deployed, others can integrate your calling system using:

**SDK URL:**
```html
<script src="https://cartier-app.github.io/webrtc/embed.js"></script>
```

**Documentation:**
- Integration Guide: https://cartier-app.github.io/webrtc/integration.html
- Live Example: https://cartier-app.github.io/webrtc/example-integration.html

## Important Notes

✅ **Config.js is included in the repository** - Your credentials will be deployed with the app  
✅ **Supabase anonymous keys are safe to expose** - They're designed to be public (not secret!)  
✅ **Enable Row Level Security (RLS)** - This is CRITICAL to protect your data in Supabase  
✅ **HTTPS is automatic** - GitHub Pages serves everything over HTTPS (required for WebRTC)  
⚠️ **Never commit secret/private keys** - Only the anonymous public key goes in config.js

For detailed deployment instructions, see [DEPLOY.md](DEPLOY.md)

---

**Need help?** Check the deployment guide or open an issue.
