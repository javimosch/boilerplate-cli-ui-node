class CLIWebUI {
    constructor() {
        this.config = {
            setting: '',
            speed: 'normal'
        };
        this.isProcessing = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadConfig();
    }

    initializeElements() {
        // Configuration elements
        this.settingInput = document.getElementById('setting-input');
        this.speedSelect = document.getElementById('speed-select');
        this.saveConfigBtn = document.getElementById('save-config-btn');

        // Action buttons
        this.runProcessBtn = document.getElementById('run-process-btn');
        this.statsBtn = document.getElementById('stats-btn');
        this.healthBtn = document.getElementById('health-btn');

        // Progress elements
        this.progressSection = document.querySelector('.progress-section');
        this.progressFill = document.querySelector('.progress__fill');
        this.progressText = document.querySelector('.progress-text');

        // Results elements
        this.resultsSection = document.querySelector('.results-section');
        this.resultSteps = document.getElementById('result-steps');
        this.resultDuration = document.getElementById('result-duration');
        this.resultSpeed = document.getElementById('result-speed');
        this.resultContent = document.getElementById('result-content');

        // Stats elements
        this.statsPanel = document.querySelector('.stats-panel');
        this.statsContent = document.getElementById('stats-content');

        // Log elements
        this.logContainer = document.getElementById('log-container');

        // Modal elements
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalOk = document.getElementById('modal-ok');
        this.modalCancel = document.getElementById('modal-cancel');
    }

    bindEvents() {
        // Configuration events
        this.settingInput.addEventListener('input', () => this.updateConfig());
        this.speedSelect.addEventListener('change', () => this.updateConfig());
        this.saveConfigBtn.addEventListener('click', () => this.saveConfig());

        // Action button events
        this.runProcessBtn.addEventListener('click', () => this.runProcess());
        this.statsBtn.addEventListener('click', () => this.showStats());
        this.healthBtn.addEventListener('click', () => this.checkHealth());

        // Modal events
        this.modalCancel.addEventListener('click', () => this.hideModal());
    }

    updateConfig() {
        this.config.setting = this.settingInput.value.trim();
        this.config.speed = this.speedSelect.value;
    }

    async loadConfig() {
        try {
            const response = await fetch('/api/config');
            if (response.ok) {
                const config = await response.json();
                this.config = { ...this.config, ...config };
                
                this.settingInput.value = this.config.setting || '';
                this.speedSelect.value = this.config.speed || 'normal';
                
                this.addLog('info', '📊 Configuration loaded successfully');
            }
        } catch (error) {
            this.addLog('error', 'Failed to load configuration');
        }
    }

    async saveConfig() {
        this.updateConfig();
        
        try {
            const response = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.config)
            });

            if (response.ok) {
                this.addLog('success', '💾 Configuration saved successfully');
            } else {
                throw new Error('Failed to save configuration');
            }
        } catch (error) {
            this.addLog('error', `❌ Failed to save configuration: ${error.message}`);
        }
    }

    async runProcess() {
        if (!this.config.setting) {
            this.addLog('error', '❌ Please enter a setting first');
            return;
        }

        if (this.isProcessing) {
            this.addLog('warning', '⚠️ Process already running');
            return;
        }

        this.isProcessing = true;
        this.runProcessBtn.disabled = true;
        this.showProgress(true);
        this.showResults(false);

        try {
            this.addLog('info', `🔄 Starting process with setting: ${this.config.setting}`);
            this.updateProgress(10, 'Initializing process...');

            const response = await fetch('/api/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.config)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            this.handleProcessUpdate(data);
                        } catch (error) {
                            // Ignore malformed JSON lines
                        }
                    }
                }
            }

            // Process any remaining data
            if (buffer.trim()) {
                try {
                    const data = JSON.parse(buffer);
                    this.handleProcessUpdate(data);
                } catch (error) {
                    // Ignore malformed JSON
                }
            }

        } catch (error) {
            this.addLog('error', `❌ Process failed: ${error.message}`);
            this.updateProgress(0, 'Process failed');
        } finally {
            this.isProcessing = false;
            this.runProcessBtn.disabled = false;
            this.showProgress(false);
        }
    }

    handleProcessUpdate(data) {
        if (data.type === 'progress') {
            this.updateProgress(data.percentage, data.message);
            this.addLog('info', data.message);
        } else if (data.type === 'complete') {
            this.updateProgress(100, 'Process complete!');
            this.addLog('success', `✅ Process completed successfully!`);
            this.displayResults(data.result);
        } else if (data.type === 'error') {
            this.addLog('error', `❌ ${data.message}`);
        }
    }

    displayResults(result) {
        this.resultSteps.textContent = result.totalSteps || 0;
        this.resultDuration.textContent = result.duration ? `${result.duration}s` : '0s';
        this.resultSpeed.textContent = result.speedSettings || 'normal';
        
        this.resultContent.textContent = JSON.stringify(result, null, 2);
        this.showResults(true);
    }

    async showStats() {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const stats = await response.json();
            this.statsContent.textContent = JSON.stringify(stats, null, 2);
            this.statsPanel.style.display = 'block';
            
            this.addLog('info', '📊 System stats loaded');
        } catch (error) {
            this.addLog('error', `❌ Failed to load stats: ${error.message}`);
        }
    }

    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const health = await response.json();
            this.addLog('success', `❤️ Health check passed: ${health.status}`);
            
            this.showModal('Health Check', `✅ System is healthy!\n\nStatus: ${health.status}\nTimestamp: ${health.timestamp}`);
        } catch (error) {
            this.addLog('error', `❌ Health check failed: ${error.message}`);
            this.showModal('Health Check Failed', `❌ System health check failed:\n\n${error.message}`);
        }
    }

    addLog(type, message) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }

    showProgress(show = true) {
        this.progressSection.style.display = show ? 'block' : 'none';
        if (!show) {
            this.progressFill.style.width = '0%';
            this.progressText.textContent = 'Ready to start...';
        }
    }

    updateProgress(percentage, text) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = text;
    }

    showResults(show = true) {
        this.resultsSection.style.display = show ? 'block' : 'none';
    }

    showModal(title, message, onConfirm = null) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.modal.style.display = 'flex';
        
        if (onConfirm) {
            this.modalOk.onclick = () => {
                this.hideModal();
                onConfirm();
            };
            this.modalCancel.style.display = 'inline-flex';
        } else {
            this.modalOk.onclick = () => this.hideModal();
            this.modalCancel.style.display = 'none';
        }
    }

    hideModal() {
        this.modal.style.display = 'none';
        this.modalOk.onclick = null;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CLIWebUI();
});
