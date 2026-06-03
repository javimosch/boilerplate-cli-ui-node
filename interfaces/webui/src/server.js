const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const GenericCLI = require('../../../src/cli.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Custom WebAPI class extending the CLI
class WebAPIManager extends GenericCLI {
    constructor() {
        super();
        this.progressCallback = null;
    }

    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    // Override methods to provide web-specific behavior
    async runProcessWithProgress(config) {
        // Set up configuration
        this.config = { ...this.config, ...config };
        
        // Set speed settings
        const speedPresets = {
            'turbo': { sleepBetweenOps: 0, batchSize: 500, progressInterval: 100 },
            'fast': { sleepBetweenOps: 10, batchSize: 200, progressInterval: 75 },
            'normal': { sleepBetweenOps: 50, batchSize: 100, progressInterval: 50 },
            'gentle': { sleepBetweenOps: 100, batchSize: 50, progressInterval: 25 }
        };
        
        this.speedSettings = speedPresets[config.speed] || speedPresets.normal;

        const startTime = Date.now();
        const totalSteps = 100;

        // Simulate processing with progress updates
        for (let i = 0; i <= totalSteps; i += this.speedSettings.batchSize) {
            const progress = Math.min(i, totalSteps);
            const percentage = Math.round((progress / totalSteps) * 100);
            
            // Send progress updates
            if (this.progressCallback && (progress % this.speedSettings.progressInterval === 0 || progress === totalSteps)) {
                this.progressCallback({
                    type: 'progress',
                    percentage,
                    message: `🔄 Processing: ${percentage}% (${progress}/${totalSteps})`
                });
            }
            
            if (this.speedSettings.sleepBetweenOps > 0) {
                await this.sleep(this.speedSettings.sleepBetweenOps);
            }
        }
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        const result = {
            setting: this.config.setting,
            totalSteps,
            duration,
            speedSettings: config.speed,
            timestamp: Date.now(),
            success: true
        };

        return result;
    }
}

// API Routes

// Get current configuration
app.get('/api/config', async (req, res) => {
    try {
        const manager = new WebAPIManager();
        await manager.loadConfig();
        res.json(manager.config);
    } catch (error) {
        console.error('Get config error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Save configuration
app.post('/api/config', async (req, res) => {
    try {
        const config = req.body;
        const manager = new WebAPIManager();
        await manager.loadConfig();
        
        // Update config with new values
        manager.config = { ...manager.config, ...config };
        await manager.saveConfig();
        
        res.json({ success: true, config: manager.config });
    } catch (error) {
        console.error('Save config error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Run process endpoint
app.post('/api/process', async (req, res) => {
    try {
        const config = req.body;
        
        // Validate input
        if (!config.setting) {
            return res.status(400).json({ error: 'Setting is required' });
        }

        // Set up streaming response
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Transfer-Encoding': 'chunked'
        });

        const manager = new WebAPIManager();
        
        // Set up progress callback
        manager.setProgressCallback((data) => {
            res.write(JSON.stringify(data) + '\n');
        });

        try {
            // Send initial progress
            res.write(JSON.stringify({
                type: 'progress',
                percentage: 5,
                message: 'Initializing process...'
            }) + '\n');

            const result = await manager.runProcessWithProgress(config);
            
            // Send completion
            res.write(JSON.stringify({
                type: 'complete',
                result: result
            }) + '\n');
            
        } catch (error) {
            res.write(JSON.stringify({
                type: 'error',
                message: error.message
            }) + '\n');
        }

        res.end();

    } catch (error) {
        console.error('Process error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Get stats endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const manager = new WebAPIManager();
        await manager.loadConfig();
        
        const stats = {
            setting: manager.config.setting || 'Not configured',
            speedPreset: manager.config.speedPreset || 'normal',
            lastUpdated: manager.config.lastUpdated || null,
            serverUptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Server start time
const startTime = new Date();

// Status endpoint (matches Go version)
app.get('/api/status', (req, res) => {
    const uptimeMs = Date.now() - startTime.getTime();
    const uptimeSeconds = uptimeMs / 1000;
    
    // Format uptime similar to Go
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);
    const uptime = hours > 0 
        ? `${hours}h${minutes}m${seconds}s`
        : minutes > 0 
            ? `${minutes}m${seconds}s`
            : `${seconds}s`;
    
    res.json({
        status: 'running',
        port: PORT,
        uptime: uptime,
        version: '1.0.0',
        start_time: startTime.toISOString()
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', version: '1.0.0' });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 CLI+WebUI Boilerplate Web UI running on http://localhost:${PORT}`);
    console.log(`📁 Open your browser and navigate to the URL above to get started!`);
});

// Handle port conflicts gracefully
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error('💡 Another instance might be running.');
        console.error('💡 Try stopping other instances or use a different port.');
        process.exit(1);
    } else {
        console.error('❌ Server error:', error.message);
        process.exit(1);
    }
});

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down web server gracefully...');
    server.close(() => {
        console.log('✅ Web server stopped.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n👋 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Web server stopped.');
        process.exit(0);
    });
});

module.exports = app;
