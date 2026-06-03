# Architecture Documentation

## Overview

This CLI+WebUI boilerplate follows a modular architecture designed for maintainability, extensibility, and user experience. The design is based on the principles outlined in `cli-rules.md` and `ui-rules.md`.

## Core Principles

### 1. Modular Design
- **Small Files**: Each file stays under 500 lines
- **Single Responsibility**: One concern per module
- **Loose Coupling**: Modules interact through well-defined interfaces
- **High Cohesion**: Related functionality grouped together

### 2. Progressive Enhancement
- **CLI First**: Core functionality accessible via command line
- **Web UI Optional**: Enhanced experience through web interface
- **Graceful Degradation**: Features work even if some components fail

### 3. User-Centric Design
- **Clear Feedback**: Users always know what's happening
- **Error Recovery**: Helpful error messages with solutions
- **Performance Control**: Users can adjust processing speed
- **Persistent State**: Configuration saved between sessions

## Component Architecture

### CLI Layer (`src/cli.js`)

The main CLI class follows the command pattern:

```javascript
class GenericCLI {
  constructor()     // Initialize state and dependencies
  loadConfig()      // Load persistent configuration
  displayMenu()     // Show available options
  run()            // Main event loop
}
```

**Key Features:**
- Menu-driven interface with numbered options
- Configuration management with persistence
- Speed control for performance tuning
- Graceful error handling and recovery
- Web UI integration

### Utility Layer (`utils/`)

Specialized modules for common operations:

#### ConfigManager (`utils/config-manager.js`)
- Handles configuration persistence
- Provides defaults and validation
- Manages configuration lifecycle

#### FileOperations (`utils/file-operations.js`)
- File system abstractions
- Path validation and safety checks
- Temporary file management
- Cross-platform compatibility

### Web Interface (`interfaces/webui/`)

Three-tier web architecture:

#### Server Layer (`src/server.js`)
- Express.js REST API
- Extends CLI functionality for web use
- Streaming responses for real-time updates
- Graceful error handling

#### Frontend Layer (`public/`)
- Vanilla JavaScript (no framework dependencies)
- Modular CSS design system
- Real-time progress updates
- Responsive design

## Data Flow

### CLI Mode
```
User Input → CLI Class → Utility Modules → File System
                ↓
         Configuration ← Config Manager
```

### Web UI Mode
```
Browser → Express Server → WebAPI Manager → Utility Modules
   ↑           ↓                ↓
Frontend ← JSON Response ← CLI Extension
```

### Configuration Flow
```
Default Config → Saved Config → Runtime Config → User Changes → Save
```

## Design Patterns

### 1. Command Pattern
Each menu option maps to a specific command method:
```javascript
switch (choice) {
  case '1': await this.configureSettings(); break;
  case '2': await this.configureSpeed(); break;
  // ...
}
```

### 2. Strategy Pattern
Speed presets implement different processing strategies:
```javascript
const SPEED_PRESETS = {
  'turbo': { sleepBetweenOps: 0, batchSize: 500 },
  'normal': { sleepBetweenOps: 50, batchSize: 100 }
};
```

### 3. Observer Pattern
Progress updates use callback-based observation:
```javascript
manager.setProgressCallback((data) => {
  res.write(JSON.stringify(data) + '\n');
});
```

### 4. Template Method Pattern
Base CLI class defines the algorithm, subclasses customize behavior:
```javascript
class WebAPIManager extends GenericCLI {
  // Override specific methods for web context
  async runProcessWithProgress(config) { /* ... */ }
}
```

## Error Handling Strategy

### Graceful Degradation
- Continue operation when non-critical errors occur
- Provide fallback options when features unavailable
- Clear error messages with actionable solutions

### Error Categories
1. **User Errors**: Invalid input, missing configuration
2. **System Errors**: File permissions, network issues
3. **Application Errors**: Logic errors, unexpected states

### Error Response Pattern
```javascript
try {
  // Operation
  return { success: true, data };
} catch (error) {
  return { success: false, error: error.message };
}
```

## Performance Considerations

### Speed Controls
Multiple performance presets allow users to balance speed vs. system impact:
- **Batch Size**: Number of operations per batch
- **Sleep Duration**: Delay between operations
- **Progress Interval**: Frequency of progress updates

### Memory Management
- Process data in batches to avoid memory issues
- Clean up temporary files automatically
- Use streaming for large data transfers

### Responsive Design
- Non-blocking operations with progress feedback
- Interruptible long-running processes
- Configurable timeouts and retries

## Security Considerations

### Input Validation
- Validate all user inputs before processing
- Sanitize file paths to prevent directory traversal
- Check file permissions before operations

### Safe Defaults
- Conservative default settings
- Dry-run mode for destructive operations
- Confirmation prompts for irreversible actions

### Error Information
- Don't expose sensitive system information in errors
- Log detailed errors server-side only
- Provide helpful but safe error messages to users

## Extensibility Points

### Adding New Features
1. **CLI Commands**: Add new menu options and handler methods
2. **API Endpoints**: Extend the Express server with new routes
3. **UI Components**: Add new sections to the web interface
4. **Utility Modules**: Create new modules in the `utils/` directory

### Configuration Extensions
```javascript
// Add new config properties
this.defaults = {
  setting: '',
  speedPreset: 'normal',
  newFeature: false  // New configuration option
};
```

### UI Extensions
```css
/* Add new component styles */
.new-component {
  /* Follow existing design token patterns */
  background: var(--surface-glass);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
}
```

## Testing Strategy

### Unit Testing
- Test utility modules in isolation
- Mock external dependencies
- Validate error handling paths

### Integration Testing
- Test CLI workflows end-to-end
- Verify API endpoints with real requests
- Test configuration persistence

### User Acceptance Testing
- Verify menu navigation works intuitively
- Test error scenarios with real users
- Validate responsive design on different devices

## Deployment Considerations

### Environment Setup
- Node.js version compatibility
- File system permissions
- Port availability for web UI

### Configuration Management
- Environment-specific settings
- Secure credential handling
- Configuration validation on startup

### Monitoring
- Health check endpoints
- Error logging and alerting
- Performance metrics collection

## Future Enhancements

### Potential Additions
- Plugin system for extensibility
- Database integration for complex data
- Authentication and authorization
- Real-time collaboration features
- Desktop application wrapper

### Scalability Considerations
- Horizontal scaling for web UI
- Background job processing
- Caching strategies
- Load balancing

This architecture provides a solid foundation for building maintainable, user-friendly CLI applications with optional web interfaces.
