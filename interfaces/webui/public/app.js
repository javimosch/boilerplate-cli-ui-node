// ─── State ──────────────────────────────────────────────────────
let currentRoute = 'dashboard';
let status = null;
let sidebarOpen = false;

// ─── Hash Router ────────────────────────────────────────────────
function getHashRoute() {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return hash || 'dashboard';
}

function navigate(route) {
    window.location.hash = `/${route}`;
}

function onHashChange() {
    currentRoute = getHashRoute();
    renderNav();
    renderPage();
}

window.addEventListener('hashchange', onHashChange);

// ─── Sidebar ────────────────────────────────────────────────────
const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
];

function openSidebar() {
    sidebarOpen = true;
    document.getElementById('sidebar').classList.remove('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.remove('hidden');
}

function closeSidebar() {
    sidebarOpen = false;
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.add('hidden');
}

function renderNav() {
    const container = document.getElementById('nav-container');
    container.innerHTML = navItems.map(item => `
        <button onclick="navigate('${item.id}'); closeSidebar();"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentRoute === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}">
            <i data-lucide="${item.icon}" class="w-5 h-5"></i>
            ${item.label}
        </button>
    `).join('');
    lucide.createIcons();
}

// ─── Status Card ────────────────────────────────────────────────
function statusCard(title, value, icon, color) {
    const colors = {
        indigo: 'bg-indigo-100 text-indigo-600',
        green: 'bg-green-100 text-green-600',
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
    };
    return `
        <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">${title}</p>
                    <p class="text-2xl font-bold text-gray-900 mt-1">${value}</p>
                </div>
                <div class="w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}">
                    <i data-lucide="${icon}" class="w-6 h-6"></i>
                </div>
            </div>
        </div>
    `;
}

// ─── Views ──────────────────────────────────────────────────────
function renderDashboard() {
    const uptime = status?.uptime?.split('.')[0] || '-';
    const endpoints = [
        { method: 'GET', path: '/api/status', description: 'Server status' },
        { method: 'GET', path: '/api/health', description: 'Health check' },
    ];
    
    return `
        <div>
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p class="text-gray-500 mt-1">Server status and overview</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                ${statusCard('Status', status?.status || 'Unknown', 'activity', 'green')}
                ${statusCard('Port', status?.port || '-', 'network', 'blue')}
                ${statusCard('Uptime', uptime, 'clock', 'purple')}
                ${statusCard('Version', status?.version || '-', 'tag', 'indigo')}
            </div>
            
            <div class="bg-white rounded-xl border border-gray-200 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">API Endpoints</h3>
                    <button onclick="fetchStatus()" class="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i> Refresh
                    </button>
                </div>
                <div class="space-y-3">
                    ${endpoints.map(ep => `
                        <div onclick="testEndpoint('${ep.path}')" class="flex items-center justify-between p-3 rounded-lg bg-gray-50 api-endpoint transition-all cursor-pointer">
                            <div class="flex items-center gap-3">
                                <span class="px-2 py-1 text-xs font-mono font-bold rounded ${ep.method === 'GET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">${ep.method}</span>
                                <span class="font-mono text-sm text-gray-700">${ep.path}</span>
                            </div>
                            <span class="text-sm text-gray-500">${ep.description}</span>
                        </div>
                    `).join('')}
                </div>
                <div id="api-response" class="mt-4 hidden">
                    <div class="p-4 rounded-lg bg-gray-900 text-green-400 font-mono text-sm overflow-x-auto">
                        <pre id="api-response-content"></pre>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSettings() {
    const settings = getSettings();
    const accentColors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f59e0b'];
    
    return `
        <div>
            <div class="mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Settings</h2>
                <p class="text-gray-500 mt-1">Configure your CLI UI</p>
            </div>
            
            <div class="space-y-6">
                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                            <select id="setting-theme" onchange="updateSetting('theme', this.value)" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                                <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                                <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>System</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                            <div class="flex gap-2">
                                ${accentColors.map(c => `
                                    <button onclick="updateSetting('accentColor', '${c}')" style="background-color: ${c}" 
                                        class="w-8 h-8 rounded-full transition-transform ${settings.accentColor === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}"></button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Refresh Interval (seconds)</label>
                            <input type="number" min="1" max="60" value="${settings.refreshInterval}" 
                                onchange="updateSetting('refreshInterval', parseInt(this.value) || 10)"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                        </div>
                        <div class="flex items-center justify-between">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Auto-refresh</label>
                                <p class="text-xs text-gray-500">Automatically refresh status</p>
                            </div>
                            <button onclick="toggleAutoRefresh()" id="auto-refresh-toggle" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoRefresh ? 'bg-indigo-600' : 'bg-gray-200'}">
                                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoRefresh ? 'translate-x-6' : 'translate-x-1'}"></span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end items-center gap-4">
                    <span id="save-message" class="text-sm text-green-600 hidden">Settings saved!</span>
                    <button onclick="saveSettings()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">Save Settings</button>
                </div>
            </div>
        </div>
    `;
}

// ─── Settings Management ────────────────────────────────────────
function getSettings() {
    const defaults = { theme: 'light', accentColor: '#6366f1', refreshInterval: 10, autoRefresh: true };
    try {
        const saved = localStorage.getItem('cli-ui-settings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
        return defaults;
    }
}

function updateSetting(key, value) {
    const settings = getSettings();
    settings[key] = value;
    localStorage.setItem('cli-ui-settings', JSON.stringify(settings));
    renderPage();
}

function toggleAutoRefresh() {
    const settings = getSettings();
    settings.autoRefresh = !settings.autoRefresh;
    localStorage.setItem('cli-ui-settings', JSON.stringify(settings));
    renderPage();
    setupAutoRefresh();
}

function saveSettings() {
    const msg = document.getElementById('save-message');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 2000);
}

// ─── API Calls ──────────────────────────────────────────────────
async function fetchStatus() {
    try {
        const res = await fetch('/api/status');
        status = await res.json();
        renderPage();
    } catch (err) {
        console.error('Failed to fetch status:', err);
    }
}

async function testEndpoint(path) {
    try {
        const res = await fetch(path);
        const data = await res.json();
        document.getElementById('api-response').classList.remove('hidden');
        document.getElementById('api-response-content').textContent = JSON.stringify(data, null, 2);
    } catch (err) {
        document.getElementById('api-response').classList.remove('hidden');
        document.getElementById('api-response-content').textContent = JSON.stringify({ error: err.message }, null, 2);
    }
}

// ─── Auto Refresh ───────────────────────────────────────────────
let refreshInterval = null;

function setupAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    const settings = getSettings();
    if (settings.autoRefresh) {
        refreshInterval = setInterval(fetchStatus, settings.refreshInterval * 1000);
    }
}

// ─── Render ─────────────────────────────────────────────────────
function renderPage() {
    const container = document.getElementById('page-content');
    container.innerHTML = currentRoute === 'dashboard' ? renderDashboard() : renderSettings();
    lucide.createIcons();
}

// ─── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Set default route if none specified
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
        window.location.hash = '/dashboard';
    }
    currentRoute = getHashRoute();
    renderNav();
    fetchStatus();
    setupAutoRefresh();
    lucide.createIcons();
});
