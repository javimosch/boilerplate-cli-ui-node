# boilerplate-cli-ui-node

**Agent-first CLI + Web UI boilerplate for Node.js.** Builds to a single binary (~123MB) with no runtime dependencies.

Part of [SuperCLI](https://github.com/javimosch/supercli) - build CLI/UI plugins fast for 2026.

**v1**: [boilerplate-cli-ui-go](https://github.com/javimosch/boilerplate-cli-ui-go) | **Go+Vue**: [boilerplate-cli-ui-go-v2-vue](https://github.com/javimosch/boilerplate-cli-ui-go-v2-vue) | **Go+React**: [boilerplate-cli-ui-go-v2-react](https://github.com/javimosch/boilerplate-cli-ui-go-v2-react)

## Philosophy

**CLI-Native, Web-Enabled, Agent-Friendly**

- **JSON-by-default**: All commands output JSON for machine parsing
- **`--human` opt-in**: Human-readable output when explicitly requested
- **Semantic exit codes**: Structured error communication (80-119 range)
- **Single binary**: No runtime dependencies via Node.js SEA

## Features

- 🚀 **CLI Mode** - Interactive menu with configuration
- 🌐 **Web UI** - Modern responsive interface with API
- ⚡ **Speed Controls** - Performance presets (turbo/fast/normal/gentle)
- 💾 **Persistent Config** - Settings saved between sessions
- 📊 **Progress Tracking** - Real-time streaming updates
- 📦 **Standalone Binary** - No Node.js required to run
- 🤖 **Agent-Friendly** - JSON output, structured errors, env vars

## Quick Start

```bash
# Install dependencies
npm install

# Run CLI
npm start

# Run Web UI
npm run ui

# Build standalone binary
npm run build
```

## Hashbang Routing

Routes use hashbang URLs:
- `http://localhost:3000/#/dashboard` - Dashboard view
- `http://localhost:3000/#/settings` - Settings view
- `http://localhost:3000/` - Defaults to dashboard

## Project Structure

```
boilerplate-cli-ui-node/
├── src/
│   ├── cli.js                  # CLI entry point
│   └── standalone-server.js    # Embedded server for binary
├── interfaces/webui/
│   ├── public/                 # Frontend (HTML/CSS/JS)
│   └── src/server.js           # Dev server
├── utils/
│   ├── config-manager.js       # Configuration
│   └── file-operations.js      # File utilities
├── build.js                    # Binary builder
├── AGENTS.md                   # Agent guidelines
└── README.md
```

## CLI Usage

```bash
# Interactive menu
./boilerplate-cli-ui-node

# Show help
./boilerplate-cli-ui-node --help

# Launch Web UI
./boilerplate-cli-ui-node --ui
```

## Web UI

- **URL**: http://localhost:3000
- **Features**: Config, progress, stats, health check
- **API**: All endpoints return JSON

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/config` | Get configuration |
| POST | `/api/config` | Save configuration |
| GET | `/api/stats` | System statistics |
| POST | `/api/process` | Run process (streaming) |

## Agent-First Design

See [AGENTS.md](./AGENTS.md) for:
- Coding rules and file size limits
- JSON output patterns
- Semantic exit codes
- Error handling patterns
- Configuration management
- Adding commands/views

### Quick Reference

```javascript
// Default JSON output
console.log(JSON.stringify({ status: 'success', data: result }));

// Structured error
throw new CLIError('Invalid input', 85, 'invalid_argument', { field: 'port' });

// Exit codes
process.exit(0);   // Success
process.exit(85);  // Invalid argument
process.exit(92);  // Not found
process.exit(110); // Internal error
```

## Build

```bash
# Build standalone binary
npm run build

# Output
dist/boilerplate-cli-ui-node  (123MB, Linux x86-64)
```

### Binary Details

- **Runtime**: Node.js 24 (embedded)
- **Platform**: Linux x86-64
- **Dependencies**: None
- **Build tool**: Node.js SEA + esbuild

## Configuration

### Environment Variables

```bash
CLIUI_PORT=3000
CLIUI_HOST=0.0.0.0
CLIUI_LOG_LEVEL=info
```

### Config File

`.cliui-config.json`:
```json
{
  "setting": "value",
  "speedPreset": "normal"
}
```

## Customization

### Adding Commands

1. Add handler in `src/commands/`
2. Add CLI routing in `src/cli.js`
3. Add API endpoint in `src/standalone-server.js`

### Adding Views

1. Create HTML in `interfaces/webui/public/`
2. Add JS logic
3. Add CSS styles

## Development

```bash
# CLI with auto-restart
npm run dev

# Web UI dev
cd interfaces/webui && npm run dev
```

## License

MIT
