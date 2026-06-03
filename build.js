// Build script for creating standalone binary
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building standalone binary...\n');

// Paths
const webuiDir = path.join(__dirname, 'interfaces/webui/public');
const srcDir = __dirname;

// Read static files
console.log('📦 Reading static files...');
const indexHtml = fs.readFileSync(path.join(webuiDir, 'index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(webuiDir, 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(webuiDir, 'app.js'), 'utf8');

console.log(`   - index.html: ${(indexHtml.length / 1024).toFixed(1)}KB`);
console.log(`   - styles.css: ${(stylesCss.length / 1024).toFixed(1)}KB`);
console.log(`   - app.js: ${(appJs.length / 1024).toFixed(1)}KB`);

// Read CLI code (strip shebang)
let cliCode = fs.readFileSync(path.join(srcDir, 'src/cli.js'), 'utf8');
if (cliCode.startsWith('#!')) {
  cliCode = cliCode.substring(cliCode.indexOf('\n') + 1);
}

// Create server code with embedded assets
console.log('\n📝 Creating standalone server...');
const serverCode = `
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Embedded static files
const STATIC_FILES = ${JSON.stringify({
  '/index.html': indexHtml,
  '/styles.css': stylesCss,
  '/app.js': appJs
})};

// Serve embedded static files
app.get('/', (req, res) => res.type('html').send(STATIC_FILES['/index.html']));
app.get('/styles.css', (req, res) => res.type('css').send(STATIC_FILES['/styles.css']));
app.get('/app.js', (req, res) => res.type('js').send(STATIC_FILES['/app.js']));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  const configFile = path.join(process.cwd(), '.cliui-config.json');
  try {
    const config = fs.readFileSync(configFile, 'utf8');
    res.json(JSON.parse(config));
  } catch {
    res.json({ setting: '', speedPreset: 'normal' });
  }
});

app.post('/api/config', express.json(), (req, res) => {
  const configFile = path.join(process.cwd(), '.cliui-config.json');
  try {
    fs.writeFileSync(configFile, JSON.stringify(req.body, null, 2));
    res.json({ success: true, config: req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', (req, res) => {
  const configFile = path.join(process.cwd(), '.cliui-config.json');
  let config = { setting: 'Not configured', speedPreset: 'normal' };
  try { config = JSON.parse(fs.readFileSync(configFile, 'utf8')); } catch {}
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

  res.writeHead(200, { 'Content-Type': 'application/json', 'Transfer-Encoding': 'chunked' });

  const totalSteps = 100;
  let current = 0;

  const processChunk = () => {
    if (current > totalSteps) {
      res.write(JSON.stringify({
        type: 'complete',
        result: { setting, totalSteps, duration: '2.50', speedSettings: speed, success: true }
      }) + '\\n');
      res.end();
      return;
    }
    res.write(JSON.stringify({
      type: 'progress',
      percentage: Math.min(Math.round((current / totalSteps) * 100), 100),
      message: '🔄 Processing: ' + current + '/' + totalSteps
    }) + '\\n');
    current += settings.batchSize;
    setTimeout(processChunk, settings.sleepBetweenOps);
  };
  processChunk();
});

app.listen(PORT, () => {
  console.log('🚀 CLI+WebUI Boilerplate running on http://localhost:' + PORT);
});
`;

// Create combined entry file in src directory (so esbuild can resolve requires)
console.log('\n📝 Creating combined entry...');
const combinedEntry = `// Combined CLI + WebUI standalone binary
const args = process.argv.slice(2);
const hasUIFlag = args.includes('--ui') || args.includes('-u');
const hasHelpFlag = args.includes('--help') || args.includes('-h');

if (hasUIFlag) {
  // Run as web server
  ${serverCode}
} else {
  // Run as CLI
  ${cliCode}
}
`;

// Write to src directory temporarily
const tempEntry = path.join(srcDir, 'src/_temp_combined.js');
fs.writeFileSync(tempEntry, combinedEntry);

// Bundle with esbuild
console.log('\n📦 Bundling with esbuild...');
try {
  execSync(`npx esbuild src/_temp_combined.js --bundle --platform=node --outfile=dist/cli-bundled.js`, {
    stdio: 'inherit'
  });
} catch (err) {
  console.error('❌ Bundle failed:', err.message);
  fs.unlinkSync(tempEntry);
  process.exit(1);
}

// Remove temp file
fs.unlinkSync(tempEntry);

// Create SEA blob
console.log('\n🔧 Creating SEA blob...');
const seaConfig = {
  main: 'dist/cli-bundled.js',
  output: 'dist/sea-prep.blob',
  disableExperimentalSEAWarning: true
};
fs.writeFileSync(path.join(__dirname, 'sea-config.json'), JSON.stringify(seaConfig, null, 2));

try {
  execSync('node --experimental-sea-config sea-config.json', { stdio: 'inherit' });
} catch (err) {
  console.error('❌ SEA blob creation failed:', err.message);
  process.exit(1);
}

// Copy Node binary
console.log('\n📋 Copying Node binary...');
const nodePath = process.execPath;
const binaryPath = path.join(__dirname, 'dist/cliui-boilerplate');
fs.copyFileSync(nodePath, binaryPath);
console.log(`   Copied from: ${nodePath}`);

// Inject blob
console.log('\n💉 Injecting blob...');
try {
  execSync(`npx postject ${binaryPath} NODE_SEA_BLOB dist/sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`, {
    stdio: 'inherit'
  });
} catch (err) {
  console.error('❌ Blob injection failed:', err.message);
  process.exit(1);
}

// Cleanup
console.log('\n🧹 Cleaning up intermediate files...');
fs.unlinkSync(path.join(__dirname, 'dist/cli-bundled.js'));
fs.unlinkSync(path.join(__dirname, 'dist/sea-prep.blob'));

// Final output
const stats = fs.statSync(binaryPath);
console.log(`\n✅ Build complete!`);
console.log(`   Output: ${binaryPath}`);
console.log(`   Size: ${(stats.size / (1024 * 1024)).toFixed(1)}MB`);
console.log(`\n🚀 Test with: ./dist/cliui-boilerplate --help`);
console.log(`🌐 Run UI with: ./dist/cliui-boilerplate --ui`);
