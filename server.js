const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  } else if (filePath === './integrate' || filePath === './integration') {
    filePath = './integration.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code, 'utf-8');
      }
    } else {
      let fileContent = content;
      
      if (extname === '.js' && (filePath.includes('script.js') || filePath.includes('embed.js'))) {
        const SUPABASE_URL = process.env.SUPABASE_URL || '';
        const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
        
        fileContent = content.toString()
          .replace('SUPABASE_URL_PLACEHOLDER', SUPABASE_URL)
          .replace('SUPABASE_ANON_KEY_PLACEHOLDER', SUPABASE_ANON_KEY);
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(fileContent, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log('WebRTC Video Call System Ready!');
  console.log('Open in your browser to get started.');
});
