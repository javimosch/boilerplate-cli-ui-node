const fs = require('fs').promises;

class ConfigManager {
  constructor(configFile) {
    this.configFile = configFile;
    this.defaults = {
      setting: '',
      speedPreset: 'normal',
      lastUpdated: null
    };
  }

  async load() {
    try {
      const configData = await fs.readFile(this.configFile, 'utf8');
      const config = JSON.parse(configData);
      return { ...this.defaults, ...config };
    } catch (error) {
      // Return defaults if config file doesn't exist or is invalid
      return { ...this.defaults };
    }
  }

  async save(config) {
    const configToSave = {
      ...config,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      await fs.writeFile(this.configFile, JSON.stringify(configToSave, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Failed to save configuration:', error.message);
      return false;
    }
  }

  async exists() {
    try {
      await fs.access(this.configFile);
      return true;
    } catch (error) {
      return false;
    }
  }

  async reset() {
    try {
      await fs.unlink(this.configFile);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ConfigManager;
