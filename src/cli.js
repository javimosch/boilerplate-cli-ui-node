#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const ConfigManager = require('../utils/config-manager');
const FileOperations = require('../utils/file-operations');

// Configuration
const CONFIG_FILE = '.cliui-config.json';

// Command line argument parsing
const args = process.argv.slice(2);
const hasUIFlag = args.includes('--ui') || args.includes('-u');
const hasHelpFlag = args.includes('--help') || args.includes('-h');

// Show help if requested
if (hasHelpFlag) {
  console.log(`
🚀 CLI+WebUI Boilerplate

Usage:
  cliui-boilerplate [options]
  node src/cli.js [options]

Options:
  --ui, -u     Launch web UI instead of CLI interface
  --help, -h   Show this help message

Examples:
  cliui-boilerplate          # Run interactive CLI
  cliui-boilerplate --ui     # Launch web UI
  cliui-boilerplate -u       # Launch web UI (short form)

For more information, visit: https://github.com/your-username/cliui-boilerplate
`);
  process.exit(0);
}

// Speed presets for performance control
const SPEED_PRESETS = {
  'turbo': {
    name: '🚀 Turbo (Fastest)',
    sleepBetweenOps: 0,
    batchSize: 500,
    progressInterval: 100
  },
  'fast': {
    name: '⚡ Fast',
    sleepBetweenOps: 10,
    batchSize: 200,
    progressInterval: 75
  },
  'normal': {
    name: '🐢 Normal (Balanced)',
    sleepBetweenOps: 50,
    batchSize: 100,
    progressInterval: 50
  },
  'gentle': {
    name: '🌱 Gentle (System-friendly)',
    sleepBetweenOps: 100,
    batchSize: 50,
    progressInterval: 25
  }
};

// Function to launch web UI
async function launchWebUI() {
  console.log('🚀 Launching Web UI...');
  console.log();

  const webuiPath = path.join(__dirname, '../interfaces/webui');
  try {
    await fs.access(webuiPath);
  } catch (error) {
    console.log('❌ Web UI directory not found.');
    throw new Error('Web UI directory not found');
  }

  const nodeModulesPath = path.join(webuiPath, 'node_modules');
  try {
    await fs.access(nodeModulesPath);
  } catch (error) {
    console.log('📦 Web UI dependencies not found. Installing...');
    console.log();
    const installProcess = spawn('npm', ['install'], {
      cwd: webuiPath,
      stdio: 'inherit'
    });
    const installResultCode = await new Promise((resolve, reject) => {
      installProcess.on('close', resolve);
      installProcess.on('error', reject);
    });
    if (installResultCode !== 0) {
      throw new Error(`npm install for web UI failed with code ${installResultCode}`);
    }
    console.log();
    console.log('✅ Web UI dependencies installed successfully!');
    console.log();
  }

  console.log('🌐 Starting web server...');
  console.log();

  return new Promise((resolve, reject) => {
    const serverProcess = spawn('npm', ['start'], {
      cwd: webuiPath,
      stdio: 'inherit',
      detached: false
    });

    serverProcess.on('close', (code) => {
      console.log(code === 0 || code === null ? '✅ Web server stopped.' : `❌ Web server exited with code ${code}.`);
      resolve({ exitCode: code === null ? 0 : code });
    });

    serverProcess.on('error', (err) => {
      console.error('❌ Failed to start web server process:', err.message);
      reject(err);
    });
  });
}

class GenericCLI {
  constructor() {
    this.config = {};
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Initialize managers
    this.configManager = new ConfigManager(CONFIG_FILE);
    this.fileOps = new FileOperations();
    
    // Default speed settings
    this.speedSettings = SPEED_PRESETS.normal;
  }

  // Utility methods
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async loadConfig() {
    this.config = await this.configManager.load();
    
    // Load speed settings if saved
    if (this.config.speedPreset && SPEED_PRESETS[this.config.speedPreset]) {
      this.speedSettings = SPEED_PRESETS[this.config.speedPreset];
    }
  }

  async saveConfig() {
    await this.configManager.save(this.config);
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  // Display methods
  displayHeader() {
    console.clear();
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    🚀 CLI+WebUI Boilerplate 🚀               ║');
    console.log('║                                                              ║');
    console.log('║           Generic modular CLI with web interface! 🌐        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log();
  }

  displayMenu() {
    console.log('📋 Available Options:');
    console.log();
    console.log('  1️⃣  Configure Settings - Set up your preferences');
    console.log('  2️⃣  Configure Speed    - Adjust processing speed');
    console.log('  3️⃣  Run Process        - Execute main functionality');
    console.log('  4️⃣  Show Stats         - Display current statistics');
    console.log('  5️⃣  Launch Web UI      - Open web interface');
    console.log('  6️⃣  Exit              - Quit the application');
    console.log();
    
    if (this.config.setting) {
      console.log(`⚙️  Current Setting: ${this.config.setting}`);
    }
    
    console.log(`⚡ Current Speed: ${this.speedSettings.name}`);
    console.log();
  }

  // Core functionality
  async configureSettings() {
    console.log('⚙️  Configure Settings');
    console.log('═'.repeat(25));
    console.log();
    
    const currentSetting = this.config.setting || '';
    if (currentSetting) {
      console.log(`Current setting: ${currentSetting}`);
      console.log();
    }
    
    const newSetting = await this.question('Enter your setting: ');
    
    if (!newSetting.trim()) {
      console.log('❌ Setting cannot be empty!');
      await this.question('Press Enter to continue...');
      return;
    }

    this.config.setting = newSetting.trim();
    await this.saveConfig();
    
    console.log('✅ Setting configured successfully!');
    console.log(`⚙️  Set to: ${this.config.setting}`);
    
    await this.question('Press Enter to continue...');
  }

  async configureSpeed() {
    console.log('⚡ Configure Processing Speed');
    console.log('═'.repeat(35));
    console.log();
    console.log('Choose a speed preset:');
    console.log();
    
    const presetKeys = Object.keys(SPEED_PRESETS);
    presetKeys.forEach((key, index) => {
      const preset = SPEED_PRESETS[key];
      const current = this.speedSettings === preset ? ' (current)' : '';
      console.log(`  ${index + 1}️⃣  ${preset.name}${current}`);
      console.log(`      Delay: ${preset.sleepBetweenOps}ms, Batch: ${preset.batchSize}, Progress: every ${preset.progressInterval}`);
      console.log();
    });
    
    const choice = await this.question(`Select speed preset (1-${presetKeys.length}): `);
    const choiceIndex = parseInt(choice) - 1;
    
    if (choiceIndex >= 0 && choiceIndex < presetKeys.length) {
      const selectedKey = presetKeys[choiceIndex];
      this.speedSettings = SPEED_PRESETS[selectedKey];
      this.config.speedPreset = selectedKey;
      await this.saveConfig();
      
      console.log(`✅ Speed configured to: ${this.speedSettings.name}`);
    } else {
      console.log('❌ Invalid choice!');
    }
    
    await this.question('Press Enter to continue...');
  }

  async runProcess() {
    console.log('🔄 Running Main Process');
    console.log('═'.repeat(25));
    console.log();
    
    if (!this.config.setting) {
      console.log('❌ Please configure settings first!');
      await this.question('Press Enter to continue...');
      return;
    }

    console.log(`⚙️  Using setting: ${this.config.setting}`);
    console.log(`⚡ Using speed: ${this.speedSettings.name}`);
    console.log('⏳ Processing...');
    console.log();

    // Simulate processing with progress updates
    const totalSteps = 100;
    for (let i = 0; i <= totalSteps; i += this.speedSettings.batchSize) {
      const progress = Math.min(i, totalSteps);
      const percentage = Math.round((progress / totalSteps) * 100);
      
      if (progress % this.speedSettings.progressInterval === 0 || progress === totalSteps) {
        process.stdout.write(`\r🔄 Progress: ${percentage}% (${progress}/${totalSteps})`);
      }
      
      if (this.speedSettings.sleepBetweenOps > 0) {
        await this.sleep(this.speedSettings.sleepBetweenOps);
      }
    }
    
    console.log('\n✅ Process completed successfully!');
    await this.question('Press Enter to continue...');
  }

  async showStats() {
    console.log('📊 Current Statistics');
    console.log('═'.repeat(25));
    console.log();
    
    console.log(`⚙️  Setting: ${this.config.setting || 'Not configured'}`);
    console.log(`⚡ Speed: ${this.speedSettings.name}`);
    console.log(`📅 Last updated: ${new Date().toLocaleString()}`);
    console.log();
    
    await this.question('Press Enter to continue...');
  }

  async launchWebUIFromMenu() {
    console.log('🚀 Launching Web UI...');
    console.log();
    console.log('💡 The web interface will run in the foreground of this terminal session.');
    console.log('💡 Close the web server (Ctrl+C) to return to this CLI menu.');
    console.log();

    const confirm = await this.question('Do you want to launch the web UI? (y/n): ');
    if (confirm.toLowerCase().startsWith('y')) {
      console.log('🌐 Starting web interface...');
      console.log();

      const tempSigintHandler = () => {
        console.log('\nℹ️  SIGINT received by CLI. Web server is expected to close.');
      };

      process.on('SIGINT', tempSigintHandler);

      try {
        await launchWebUI();
        console.log('✅ Web UI session finished.');
      } catch (error) {
        console.error('❌ Error during Web UI session:', error.message);
      } finally {
        process.removeListener('SIGINT', tempSigintHandler);
      }
      
      if (!this.rl.closed) {
        try {
          await this.question('Press Enter to return to the menu...');
        } catch (e) {
          console.log('\nℹ️  CLI prompt was interrupted. Returning to main loop.');
        }
      }
    } else {
      console.log('❌ Web UI launch cancelled.');
      await this.question('Press Enter to continue...');
    }
  }

  async run() {
    await this.loadConfig();

    while (true) {
      this.displayHeader();
      this.displayMenu();

      const choice = await this.question('Select an option (1-6): ');

      switch (choice.trim()) {
        case '1':
          await this.configureSettings();
          break;
        case '2':
          await this.configureSpeed();
          break;
        case '3':
          await this.runProcess();
          break;
        case '4':
          await this.showStats();
          break;
        case '5':
          await this.launchWebUIFromMenu();
          break;
        case '6':
          console.log('👋 Goodbye! Thanks for using CLI+WebUI Boilerplate!');
          this.rl.close();
          return;
        default:
          console.log('❌ Invalid option. Please select 1-6.');
          await this.question('Press Enter to continue...');
      }
    }
  }
}

// Main execution block
if (require.main === module) {
  if (hasUIFlag) {
    (async () => {
      try {
        process.on('SIGINT', () => {
          console.log('\n👋 SIGINT received in --ui mode. Web server should be shutting down.');
        });
        const { exitCode } = await launchWebUI();
        process.exit(exitCode);
      } catch (error) {
        console.error('❌ Failed to launch web UI:', error.message);
        process.exit(1);
      }
    })();
  } else {
    // Run the interactive CLI
    const cli = new GenericCLI();
    cli.run().catch(error => {
      if (error.message && error.message.includes('readline was closed')) {
        console.log('\n👋 CLI session terminated.');
      } else {
        console.error('❌ Fatal error in CLI:', error.message);
      }
      process.exit(1);
    });
  }
}

module.exports = GenericCLI;
