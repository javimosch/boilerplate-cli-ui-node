const fs = require('fs').promises;
const path = require('path');

class FileOperations {
  constructor() {
    this.workingDir = '.temp';
  }

  async ensureWorkingDir() {
    try {
      await fs.mkdir(this.workingDir, { recursive: true });
      return true;
    } catch (error) {
      console.error('❌ Failed to create working directory:', error.message);
      return false;
    }
  }

  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async isDirectory(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  async isFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch (error) {
      return false;
    }
  }

  async readTextFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async writeTextFile(filePath, content) {
    try {
      await fs.writeFile(filePath, content, 'utf8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files = [];
      const directories = [];
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          directories.push(entry.name);
        } else if (entry.isFile()) {
          files.push(entry.name);
        }
      }
      
      return { success: true, files, directories };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        success: true,
        stats: {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile()
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  generateHash(input) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
  }

  async createTempFile(content, extension = '.tmp') {
    await this.ensureWorkingDir();
    const filename = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${extension}`;
    const filePath = path.join(this.workingDir, filename);
    
    const result = await this.writeTextFile(filePath, content);
    if (result.success) {
      return { success: true, filePath };
    } else {
      return result;
    }
  }

  async cleanupTempFiles() {
    try {
      const exists = await this.pathExists(this.workingDir);
      if (!exists) return { success: true, message: 'No temp directory to clean' };
      
      const { success, files } = await this.listDirectory(this.workingDir);
      if (!success) return { success: false, error: 'Failed to list temp directory' };
      
      let cleanedCount = 0;
      for (const file of files) {
        try {
          await fs.unlink(path.join(this.workingDir, file));
          cleanedCount++;
        } catch (error) {
          // Continue cleaning other files
        }
      }
      
      return { success: true, cleanedCount };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = FileOperations;
