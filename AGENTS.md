# AGENTS.md - Agent-First Node.js CLI+WebUI

This document guides AI agents in understanding, extending, and maintaining `boilerplate-cli-ui-node`.

## Project Philosophy

This boilerplate implements **agent-first CLI design**:

- **JSON-by-default**: All CLI commands output JSON unless `--human` flag
- **Structured errors**: Error objects with code, type, recoverable, suggestions
- **Output separation**: stdout for data, stderr for logs/progress
- **Single binary**: Builds to standalone executable via Node.js SEA
- **Agent-first HTTP**: JSON API at `/api/*`, UI at `/`
- **No interactivity by default**: All operations non-interactive unless explicitly requested

## Project Structure

```
boilerplate-cli-ui-node/
├── src/
│   ├── cli.js                  # CLI entry point and command routing
│   └── standalone-server.js    # Embedded web server for binary
├── interfaces/webui/
│   ├── public/                 # Frontend (HTML/CSS/JS)
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app.js
│   └── src/server.js           # Dev server (not in binary)
├── utils/
│   ├── config-manager.js       # Configuration persistence
│   └── file-operations.js      # File utilities
├── build.js                    # Binary builder (SEA)
├── package.json
├── README.md
└── AGENTS.md                   # This file
```

## Coding Rules

### File Size Limits

- **Max 500 LOC per JS file** - Split files that exceed this
- **Max 300 LOC per documentation file** - Keep docs concise
- **Max 200 LOC per test file** - Split complex tests

### Module Organization

| Directory | Responsibility |
|-----------|----------------|
| `src/` | Core application logic (CLI, server) |
| `interfaces/` | User interfaces (webui) |
| `utils/` | Reusable utilities (config, files) |
| `dist/` | Build output (binary, temp files) |

### Naming Conventions

- **JS files**: `kebab-case.js` for files
- **Functions**: `camelCase` for functions
- **Classes**: `PascalCase` for classes
- **Constants**: `UPPER_SNAKE_CASE` for constants
- **Config keys**: `camelCase` in JSON

### Agent-First Output Patterns

**Default JSON Output (CLI):**
```javascript
// Always output JSON by default
const result = {
  status: "success",
  data: { /* ... */ },
  timestamp: new Date().toISOString()
};
console.log(JSON.stringify(result, null, 2));
```

**Human-Readable Output (opt-in):**
```javascript
// Only when --human flag is passed
if (humanMode) {
  console.log(`✅ Success: ${result.data.id}`);
} else {
  console.log(JSON.stringify(result, null, 2));
}
```

**Structured Errors:**
```javascript
class CLIError extends Error {
  constructor(message, code, type = 'unknown', details = {}, recoverable = false, suggestions = []) {
    super(message);
    this.code = code;
    this.type = type;
    this.details = details;
    this.recoverable = recoverable;
    this.suggestions = suggestions;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        type: this.type,
        message: this.message,
        details: this.details,
        recoverable: this.recoverable,
        suggestions: this.suggestions
      }
    };
  }
}

// Usage
throw new CLIError(
  'Invalid port number',
  85,
  'invalid_argument',
  { port: 70000, valid_range: '1-65535' },
  true,
  ['Use a port between 1 and 65535', 'Check if port is already in use']
);
```

**Output Separation:**
```javascript
// Data goes to stdout
console.log(JSON.stringify(result));

// Logs go to stderr
console.error('Processing...', JSON.stringify({ type: 'progress', percent: 50 }));
```

### Semantic Exit Codes

```javascript
const EXIT_CODES = {
  SUCCESS: 0,
  INVALID_ARGUMENT: 85,
  BAD_PERMISSIONS: 86,
  RESOURCE_NOT_FOUND: 92,
  CONNECTION_TIMEOUT: 105,
  INTERNAL_ERROR: 110
};

// Usage
if (port < 1 || port > 65535) {
  process.exit(EXIT_CODES.INVALID_ARGUMENT);
}
```

## API Response Patterns

### JSON Response Structure

```javascript
// Success response
app.get('/api/resource', (req, res) => {
  res.json({
    status: 'ok',
    data: { /* ... */ },
    timestamp: new Date().toISOString()
  });
});

// Error response
app.get('/api/resource', (req, res) => {
  res.status(400).json({
    status: 'error',
    error: {
      code: 400,
      type: 'invalid_request',
      message: 'Missing required parameter',
      details: { param: 'id' },
      recoverable: true,
      suggestions: ['Provide an id parameter']
    }
  });
});
```

### Streaming Response Pattern

```javascript
app.post('/api/process', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chunked'
  });

  const processChunk = () => {
    // Send progress
    res.write(JSON.stringify({
      type: 'progress',
      percentage: 50,
      message: 'Processing...'
    }) + '\n');

    // Send completion
    res.write(JSON.stringify({
      type: 'complete',
      result: { /* ... */ }
    }) + '\n');
    
    res.end();
  };

  processChunk();
});
```

## Configuration Management

### Environment Variables

Prefix all environment variables with `CLIUI_`:

```bash
CLIUI_PORT=3000
CLIUI_HOST=0.0.0.0
CLIUI_LOG_LEVEL=info
CLIUI_CONFIG_FILE=.cliui-config.json
CLIUI_NO_INTERACTIVE=1
```

### Config File Pattern

```javascript
const config = {
  port: process.env.CLIUI_PORT || 3000,
  host: process.env.CLIUI_HOST || '0.0.0.0',
  logLevel: process.env.CLIUI_LOG_LEVEL || 'info'
};
```

## Adding New Commands

### 1. Add Command Handler

```javascript
// src/commands/mycommand.js
class MyCommand {
  constructor(formatter) {
    this.formatter = formatter;
  }

  async execute(params) {
    const result = {
      status: 'success',
      command: 'mycommand',
      params,
      timestamp: new Date().toISOString()
    };
    return this.formatter.output(result, EXIT_CODES.SUCCESS);
  }
}

module.exports = MyCommand;
```

### 2. Add CLI Routing (in cli.js)

```javascript
case 'mycommand':
  await myCommand.execute({ param: args[1] });
  break;
```

### 3. Add API Endpoint (in server.js)

```javascript
app.post('/api/mycommand', express.json(), async (req, res) => {
  try {
    const result = await myCommand.execute(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json(err.toJSON());
  }
});
```

## Adding New Views

### 1. Create HTML Structure

```html
<!-- interfaces/webui/public/views/myview.html -->
<section class="card">
  <h2>My View</h2>
  <div id="myview-content"></div>
</section>
```

### 2. Add JavaScript Logic

```javascript
// interfaces/webui/public/js/myview.js
class MyView {
  constructor() {
    this.container = document.getElementById('myview-content');
  }

  async loadData() {
    const response = await fetch('/api/mycommand');
    const data = await response.json();
    this.render(data);
  }

  render(data) {
    this.container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
}
```

### 3. Add CSS Styles

```css
/* interfaces/webui/public/css/myview.css */
.myview-card {
  background: var(--surface-elevated);
  border-radius: var(--radius-lg);
}
```

## Testing Guidelines

### Test Structure

```javascript
// tests/mycommand.test.js
const assert = require('assert');
const MyCommand = require('../src/commands/mycommand');

describe('MyCommand', () => {
  it('should return success result', async () => {
    const cmd = new MyCommand();
    const result = await cmd.execute({ param: 'test' });
    assert.strictEqual(result.status, 'success');
  });

  it('should handle invalid input', async () => {
    const cmd = new MyCommand();
    try {
      await cmd.execute({ param: null });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.code, EXIT_CODES.INVALID_ARGUMENT);
    }
  });
});
```

### Agent-Friendly Test Patterns

- Test JSON schema validation
- Test semantic exit codes
- Test error format structure
- Test `--human` mode output
- Test stderr/stdout separation
- Test environment variable handling

## Agent-First Design Checklist

When extending this boilerplate, ensure:

- [ ] CLI commands default to JSON output
- [ ] `--human` flag provides human-readable output
- [ ] Semantic exit codes for all error paths
- [ ] Structured error output with recovery hints
- [ ] Output separation (stdout data, stderr logs)
- [ ] No interactive prompts by default
- [ ] API endpoints return JSON with stable structure
- [ ] Environment variables for configuration
- [ ] Max 500 LOC per file
- [ ] Clear module responsibilities
- [ ] Comprehensive error handling
- [ ] Proper error propagation

## Build & Binary

### Development

```bash
npm run dev          # Run CLI with nodemon
npm run ui           # Run web UI dev server
```

### Production Build

```bash
npm run build        # Build standalone binary
./dist/boilerplate-cli-ui-node --help     # Test CLI
./dist/boilerplate-cli-ui-node --ui       # Test Web UI
```

### Binary Details

- **Size**: ~123MB (includes Node.js runtime)
- **Platform**: Linux x86-64
- **Dependencies**: None (fully self-contained)
- **Build tool**: Node.js SEA (Single Executable Applications)

## Common Patterns

### Reading Configuration

```javascript
const configManager = new ConfigManager('.cliui-config.json');
const config = await configManager.load();
console.log(config.setting);
```

### File Operations

```javascript
const fileOps = new FileOperations();
await fileOps.writeJson('data.json', { key: 'value' });
const data = await fileOps.readJson('data.json');
```

### Error Handling

```javascript
try {
  const result = await performOperation();
  return formatter.output(result, EXIT_CODES.SUCCESS);
} catch (err) {
  if (err instanceof CLIError) {
    return formatter.outputError(err.toJSON(), err.code);
  }
  const internalErr = new CLIError(
    `Unexpected error: ${err.message}`,
    EXIT_CODES.INTERNAL_ERROR
  );
  return formatter.outputError(internalErr.toJSON(), internalErr.code);
}
```

## Future Enhancements

- [ ] Add comprehensive JSON schema validation
- [ ] Add `--help-json` command for machine-readable help
- [ ] Add `--schema` flag for schema discovery
- [ ] Add authentication for web UI
- [ ] Add HTTPS support
- [ ] Add systemd service file generation
- [ ] Add metrics/monitoring endpoints
- [ ] Add integration tests
- [ ] Add cross-platform builds (macOS, Windows)

## References

- [Command Line Interface Guidelines](https://clig.dev/)
- [Agent-Friendly CLI Design](https://www.infoq.com/articles/ai-agent-driven-clis/)
- [Node.js Single Executable Applications](https://nodejs.org/docs/latest-v20.x/api/single-executable-applications.html)
