# MTYB Plugin SDK

A comprehensive SDK for developing plugins for the MTYB Virtual Goods Platform.

## Overview

The MTYB Plugin SDK provides a powerful and secure framework for creating
plugins that extend the functionality of the MTYB platform. It includes:

- **Type-safe APIs** for storage, UI, network, system, and crypto operations
- **Permission system** for secure plugin execution
- **Event system** for plugin communication
- **CLI tools** for plugin development and deployment
- **Testing framework** for plugin validation
- **Template system** for quick project setup

## Quick Start

### Installation

```bash
npm install @mtyb/plugin-sdk
```

### Create a new plugin

```bash
npx mtyb-cli create my-awesome-plugin --template=basic
cd my-awesome-plugin
npm install
```

### Basic Plugin Structure

```typescript
import { Plugin, PluginContext, PluginAPI } from '@mtyb/plugin-sdk';

export default class MyPlugin extends Plugin {
  constructor(context: PluginContext, api: PluginAPI) {
    super(context, api);
  }

  async onActivate(): Promise<void> {
    this.api.ui.showToast('Plugin activated!', 'success');
  }

  async run(): Promise<void> {
    // Main plugin logic
    const data = await this.api.storage.get('myData');
    console.log('Retrieved data:', data);
  }
}
```

## API Reference

### Storage API

Secure key-value storage for plugin data:

```typescript
// Store data
await api.storage.set('key', { value: 'data' });

// Retrieve data
const data = await api.storage.get('key');

// Check if key exists
const exists = await api.storage.has('key');

// Get all keys
const keys = await api.storage.keys();

// Remove data
await api.storage.remove('key');

// Clear all data
await api.storage.clear();
```

### UI API

Create user interfaces and show notifications:

```typescript
// Show toast notification
api.ui.showToast('Hello World!', 'success');

// Show modal dialog
const result = await api.ui.showModal({
  title: 'Confirm Action',
  content: 'Are you sure?',
  buttons: [
    { label: 'Cancel', action: 'cancel' },
    { label: 'OK', action: 'ok', variant: 'primary' },
  ],
});

// Show system notification
await api.ui.showNotification({
  title: 'Plugin Update',
  body: 'Your plugin has been updated!',
  icon: '🔔',
});

// Create UI component
const button = api.ui.createComponent('button', {
  text: 'Click me',
  onClick: () => console.log('Clicked!'),
});
```

### Network API

Make HTTP requests and WebSocket connections:

```typescript
// HTTP GET request
const response = await api.network.http.get('/api/data');
const data = await response.json();

// HTTP POST request
const result = await api.network.http.post('/api/submit', {
  data: 'payload',
});

// WebSocket connection
const ws = await api.network.websocket.connect('wss://api.example.com');
ws.on('message', data => console.log('Received:', data));
ws.send('Hello Server!');
```

### System API

Access system features like clipboard and device info:

```typescript
// Clipboard operations
await api.system.clipboard.write('Hello Clipboard!');
const text = await api.system.clipboard.read();

// Device information
const info = await api.system.device.getInfo();
console.log('Platform:', info.platform);

// Vibrate device
api.system.device.vibrate(100);

// Open URL
api.system.device.openURL('https://example.com');

// Share content
await api.system.device.share({
  title: 'Check this out!',
  text: 'Amazing content',
  url: 'https://example.com',
});
```

### Crypto API

Cryptographic operations for security:

```typescript
// Hash data
const hash = await api.crypto.hash('sensitive data', 'SHA-256');

// Encrypt/decrypt data
const encrypted = await api.crypto.encrypt('secret', 'password');
const decrypted = await api.crypto.decrypt(encrypted, 'password');

// Generate keys
const key = await api.crypto.generateKey(32);
const uuid = api.crypto.uuid();

// Random bytes
const bytes = api.crypto.randomBytes(16);
```

### Analytics API

Track user interactions and plugin usage:

```typescript
// Track events
api.analytics.track('button_clicked', {
  button_id: 'main_action',
  user_type: 'premium',
});

// Identify users
api.analytics.identify('user123', {
  name: 'John Doe',
  plan: 'premium',
});

// Track page views
api.analytics.page('plugin_dashboard', {
  section: 'main',
});
```

## Plugin Lifecycle

Plugins have several lifecycle methods that can be implemented:

```typescript
export default class MyPlugin extends Plugin {
  // Called when plugin is first installed
  async onInstall(): Promise<void> {
    await this.api.storage.set('installed', true);
  }

  // Called when plugin is activated
  async onActivate(): Promise<void> {
    this.api.ui.showToast('Plugin activated!', 'success');
  }

  // Called when plugin is deactivated
  async onDeactivate(): Promise<void> {
    // Cleanup active operations
  }

  // Called when plugin is uninstalled
  async onUninstall(): Promise<void> {
    await this.api.storage.clear();
  }

  // Called when plugin is updated
  async onUpdate(oldVersion: string, newVersion: string): Promise<void> {
    // Handle data migration
    if (oldVersion < '2.0.0') {
      await this.migrateToV2();
    }
  }

  // Called when configuration changes
  async onConfigure(config: any): Promise<void> {
    await this.api.storage.set('config', config);
  }

  // Handle system events
  async onEvent(event: PluginEvent): Promise<void> {
    switch (event.type) {
      case 'network.online':
        // Handle network reconnection
        break;
      case 'ui.theme.changed':
        // Handle theme changes
        break;
    }
  }

  // Main plugin execution
  async run(): Promise<void> {
    // Your plugin logic here
  }
}
```

## Plugin Manifest

Every plugin needs a `manifest.json` file:

```json
{
  "name": "my-awesome-plugin",
  "displayName": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "An amazing plugin for MTYB",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "license": "MIT",
  "category": "productivity",
  "engines": {
    "mtyb": "^1.0.0"
  },
  "permissions": ["storage.read", "storage.write", "network.http", "ui.toast"],
  "main": "dist/index.js",
  "configSchema": {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "description": "API key for external service"
      }
    }
  }
}
```

## Permissions

Plugins must declare the permissions they need:

| Permission          | Description                  |
| ------------------- | ---------------------------- |
| `storage.read`      | Read from plugin storage     |
| `storage.write`     | Write to plugin storage      |
| `network.http`      | Make HTTP requests           |
| `network.websocket` | Create WebSocket connections |
| `ui.toast`          | Show toast notifications     |
| `ui.modal`          | Show modal dialogs           |
| `ui.notifications`  | Show system notifications    |
| `system.clipboard`  | Access clipboard             |
| `system.files`      | Access file system           |
| `crypto.hash`       | Use hashing functions        |
| `crypto.encrypt`    | Use encryption functions     |

## CLI Commands

The MTYB CLI provides several commands for plugin development:

```bash
# Create a new plugin
mtyb-cli create <name> [--template=basic|ui|service]

# Build the plugin
mtyb-cli build

# Run tests
mtyb-cli test

# Validate plugin
mtyb-cli validate

# Start development server
mtyb-cli dev

# Publish plugin
mtyb-cli publish

# Install plugin
mtyb-cli install <plugin-name>
```

## Templates

Three plugin templates are available:

### Basic Template

- Simple plugin structure
- Storage and UI examples
- Event handling

### UI Template

- React components
- Advanced UI interactions
- Theme support

### Service Template

- Background service
- API integration
- Periodic tasks

## Testing

The SDK includes a comprehensive testing framework:

```typescript
import {
  PluginTestRunner,
  PluginTestBuilder,
  StandardPluginTests,
} from '@mtyb/plugin-sdk/test';
import MyPlugin from './MyPlugin';

// Create test runner
const runner = new PluginTestRunner();

// Add standard tests
const plugin = new MyPlugin(mockContext, mockAPI);
const standardTests = [
  ...StandardPluginTests.createLifecycleTests(plugin),
  ...StandardPluginTests.createPermissionTests(plugin, ['storage.read']),
  ...StandardPluginTests.createStorageTests(plugin),
];

standardTests.forEach(test => runner.addTest(test));

// Add custom tests
const builder = new PluginTestBuilder(plugin);

runner.addTest({
  name: 'Custom plugin test',
  async run() {
    builder.reset();

    // Set up mock responses
    builder.mockAPI.setMockResponse('storage.get', { value: 'test' });

    // Test plugin behavior
    await builder.testRun();

    // Verify expectations
    const calls = builder.mockAPI.getCalls('storage.get');
    builder.expect(calls).toHaveLength(1);
  },
});

// Run all tests
const results = await runner.runTests();
console.log(`${results.passed}/${results.totalTests} tests passed`);
```

## Development Workflow

1. **Create** a new plugin using the CLI
2. **Develop** your plugin logic
3. **Test** using the testing framework
4. **Build** for production
5. **Validate** the plugin package
6. **Publish** to the plugin store

## Best Practices

### Security

- Only request permissions you actually need
- Validate all external input
- Use the crypto API for sensitive operations
- Handle errors gracefully

### Performance

- Cache data when appropriate
- Use efficient algorithms
- Minimize network requests
- Clean up resources in `onDeactivate`

### User Experience

- Provide clear feedback to users
- Handle offline scenarios
- Support both light and dark themes
- Use appropriate notification types

### Code Quality

- Write comprehensive tests
- Follow TypeScript best practices
- Document your code
- Use meaningful variable names

## Examples

### Simple VPN Plugin

See `src/examples/SamplePlugin.ts` for a complete example of a VPN management
plugin that demonstrates:

- Plugin lifecycle management
- UI component creation
- Network API usage
- Configuration handling
- Event processing
- Error handling

### Plugin Templates

Use the CLI to generate examples:

```bash
# Basic plugin
mtyb-cli create basic-example --template=basic

# UI plugin with React
mtyb-cli create ui-example --template=ui

# Service plugin with background tasks
mtyb-cli create service-example --template=service
```

## Support

- **Documentation**:
  [https://docs.mtyb.shop/plugins](https://docs.mtyb.shop/plugins)
- **API Reference**: [https://docs.mtyb.shop/api](https://docs.mtyb.shop/api)
- **Community**: [https://community.mtyb.shop](https://community.mtyb.shop)
- **Issues**:
  [https://github.com/mtyb/plugin-sdk/issues](https://github.com/mtyb/plugin-sdk/issues)

## License

MIT License - see LICENSE file for details.
