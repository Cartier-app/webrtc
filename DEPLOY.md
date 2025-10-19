# 🚀 Deploying CallConnect to GitHub Pages

This guide will help you deploy your CallConnect WebRTC video calling app to GitHub Pages at `https://cartier-app.github.io/webrtc/`

## Prerequisites

- A GitHub account
- Your Supabase project credentials (URL and Anonymous Key)
- Git installed on your computer

## Step-by-Step Deployment

### 1. Configure Your Supabase Credentials

Before deploying, you need to add your Supabase credentials:

```bash
# Copy the example config file
cp config.example.js config.js
```

Edit `config.js` and replace the placeholders with your actual Supabase credentials:

```javascript
window.CALLCONNECT_CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-actual-anon-key-here'
};
```

**Where to find your credentials:**
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on Settings → API
4. Copy the "Project URL" and "anon public" key

### 2. Create Your GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository named `webrtc`
2. Make sure it's **public** (required for GitHub Pages)
3. Don't initialize with README, .gitignore, or license (we already have these)

### 3. Push Your Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit - CallConnect WebRTC app"

# Add your GitHub repository as remote
git remote add origin https://github.com/cartier-app/webrtc.git

# Push to GitHub
git push -u origin main
```

**Note:** If your default branch is `master` instead of `main`, use:
```bash
git branch -M main
git push -u origin main
```

### 4. Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/cartier-app/webrtc`
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under "Source", select **Deploy from a branch**
5. Select branch: **main** (or **master**)
6. Select folder: **/ (root)**
7. Click **Save**

### 5. Wait for Deployment

GitHub Pages will now build and deploy your site. This usually takes 1-2 minutes.

You can check the deployment status:
1. Go to the **Actions** tab in your repository
2. You'll see a "pages build and deployment" workflow
3. Wait for the green checkmark ✓

### 6. Access Your Deployed App

Once deployed, your app will be available at:
**https://cartier-app.github.io/webrtc/**

### 7. Test the Integration

Visit the integration documentation at:
**https://cartier-app.github.io/webrtc/integration.html**

Or try the live example at:
**https://cartier-app.github.io/webrtc/example-integration.html**

## Important Security Notes

### ⚠️ Config.js Security

**IMPORTANT:** The `config.js` file contains your Supabase credentials and will be deployed with your app.

**Security considerations:**
- GitHub Pages will serve `config.js` publicly, so anyone can see your Supabase anonymous key
- **This is acceptable** for Supabase anonymous keys as they're designed to be public
- **Make sure you have Row Level Security (RLS) policies enabled** in Supabase to protect your data
- Never put secret keys or private keys in config.js
- The Supabase anonymous (anon) key is safe to expose - it's meant to be used in client-side code

**The config.js file will be committed and deployed automatically** when you push to GitHub.

### 🔒 Enable Row Level Security

Protect your Supabase database with RLS policies:

1. Go to Supabase Dashboard → Authentication → Policies
2. Enable RLS on your `rooms` and `participants` tables
3. Add policies to allow public read/write (or customize based on your needs)

Example SQL for basic RLS:
```sql
-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert rooms
CREATE POLICY "Allow public insert on rooms" ON rooms
  FOR INSERT WITH CHECK (true);

-- Allow anyone to read active rooms
CREATE POLICY "Allow public read on active rooms" ON rooms
  FOR SELECT USING (is_active = true);

-- Similar policies for participants table
CREATE POLICY "Allow public insert on participants" ON participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on participants" ON participants
  FOR SELECT USING (true);

CREATE POLICY "Allow public update on participants" ON participants
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on participants" ON participants
  FOR DELETE USING (true);
```

## Updating Your Deployment

Whenever you make changes to your code:

```bash
# Add your changes
git add .

# Commit
git commit -m "Description of your changes"

# Push to GitHub
git push
```

GitHub Pages will automatically redeploy your site within 1-2 minutes.

## Troubleshooting

### Issue: Page shows 404 error

**Solution:** Make sure:
1. GitHub Pages is enabled in repository settings
2. You've selected the correct branch and folder
3. Wait 2-3 minutes for initial deployment

### Issue: Supabase connection not working

**Solution:** Check:
1. `config.js` is present in the repository (not ignored)
2. Credentials in `config.js` are correct
3. Check browser console for errors
4. Verify Supabase project is active and accessible

### Issue: Camera/microphone not working

**Solution:**
- GitHub Pages serves over HTTPS, which is required for WebRTC
- Make sure you grant browser permissions when prompted
- Check if your browser supports WebRTC

### Issue: Integration SDK not loading from other sites

**Solution:**
- Verify the SDK URL is correct: `https://cartier-app.github.io/webrtc/embed.js`
- Check CORS settings (GitHub Pages allows CORS by default)
- Check browser console for errors

## Using a Custom Domain (Optional)

You can use your own domain instead of `cartier-app.github.io/webrtc`:

1. Go to repository Settings → Pages
2. Add your custom domain under "Custom domain"
3. Follow GitHub's instructions to configure DNS
4. Update URLs in `embed.js` if needed

## Need Help?

- Check the browser console for error messages
- Review the [GitHub Pages documentation](https://docs.github.com/en/pages)
- Review the [Supabase documentation](https://supabase.com/docs)

---

**Your app is now live and ready to be integrated into any website! 🎉**
