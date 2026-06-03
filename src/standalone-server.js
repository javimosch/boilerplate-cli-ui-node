// Standalone server with embedded static files
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Embedded static files (will be replaced at build time)
const STATIC_FILES = {
  '/index.html': 'PLACEHOLDER_INDEX',
  '/styles.css': 'PLACEHOLDER_CSS',
  '/app.js': 'PLACEHOLDER_APPJS'
};

// Serve embedded static files
app.get('/', (req, res) => {
  res.type('html').send(STATIC_FILES['/index.html']);
});

app.get('/styles.css', (req, res) => {
  res.type('css').send(STATIC_FILES['/styles.css']);
});

app.get('/app.js', (req, res) => {
  res.type('js').send(STATIC_FILES['/app.js']);
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  const configFile = path.join(process.cwd(), '.cliui-config.json');
  try {
    const config = require('fs').readFileSync(configFile, 'utf8');
    res.json(JSON.parse(config));
  } catch {
    res.json({ setting: '', speedPreset: 'normal' });
  }
});

app.post('/api/config', express.json(), (req, res) => {
  const configFile = path.join(process.cwd(), '.cliui-config.json');
  try {
    require('fs').writeFileSync(configFile, JSON.stringify(req.body, null, 2));
    res.json({ success: true, config: req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', (req, res) => {
  const configFile = path.join(process.cwd(), '.cliui-config.json');
  let config = { setting: 'Not configured', speedPreset: 'normal' };
  try {
    config = JSON.parse(require('fs').readFileSync(configFile, 'utf8'));
  } catch {}
  
  res.json({
    setting: config.setting || 'Not configured',
    speedPreset: config.speedPreset || 'normal',
    serverUptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/process', express.json(), (req, res) => {
  const { setting, speed } = req.body;
  if (!setting) return res.status(400).json({ error: 'Setting is required' });

  const speedSettings = {
    turbo: { sleepBetweenOps: 0, batchSize: 500 },
    fast: { sleepBetweenOps: 10, batchSize: 200 },
    normal: { sleepBetweenOps: 50, batchSize: 100 },
    gentle: { sleepBetweenOps: 100, batchSize: 50 }
  };
  
  const settings = speedSettings[speed] || speedSettings.normal;
  
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chunked'
  });

  const totalSteps = 100;
  let current = 0;

  const processChunk = () => {
    if (current > totalSteps) {
      res.write(JSON.stringify({
        type: 'complete',
        result: { setting, totalSteps, duration: '2.50', speedSettings: speed, success: true }
      }) + '\n');
      res.end();
      return;
    }

    res.write(JSON.stringify({
      type: 'progress',
      percentage: Math.min(Math.round((current / totalSteps) * 100), 100),
      message: `🔄 Processing: ${current}/${totalSteps}`
    }) + '\n');

    current += settings.batchSize;
    setTimeout(processChunk, settings.sleepBetweenOps);
  };

  processChunk();
});

const server = app.listen(PORT, () => {
  console.log(`🚀 CLI+WebUI Boilerplate running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  server.close(() => process.exit(0));
});
