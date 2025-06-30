// ============================================================================
// MTYB Virtual Goods Platform - Plugin Documentation Generator
// ============================================================================

import { BasePlugin } from '../../types/plugin';
import { type PluginConfig, ProductCategory } from '../../types';
import { Logger } from '../utils/Logger';

// ============================================================================
// Documentation Generator Interface
// ============================================================================

export interface PluginDocumentation {
  overview: string;
  configuration: string;
  usage: string;
  api: string;
  examples: string;
  troubleshooting: string;
  changelog: string;
}

export interface ConfigField {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: any;
  example?: any;
}

// ============================================================================
// Plugin Documentation Generator
// ============================================================================

export class PluginDocumentationGenerator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('PluginDocGenerator');
  }

  // ============================================================================
  // Main Documentation Generation
  // ============================================================================

  generateFullDocumentation(
    plugin: BasePlugin,
    configFields: ConfigField[] = []
  ): PluginDocumentation {
    const config = plugin.config;

    return {
      overview: this.generateOverview(config),
      configuration: this.generateConfiguration(configFields),
      usage: this.generateUsage(config),
      api: this.generateAPI(plugin),
      examples: this.generateExamples(config, configFields),
      troubleshooting: this.generateTroubleshooting(config),
      changelog: this.generateChangelog(config),
    };
  }

  generateMarkdownDocumentation(plugin: BasePlugin, configFields: ConfigField[] = []): string {
    const docs = this.generateFullDocumentation(plugin, configFields);
    const config = plugin.config;

    return `# ${config.name} Plugin

${docs.overview}

## Table of Contents

- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)

## Configuration

${docs.configuration}

## Usage

${docs.usage}

## API Reference

${docs.api}

## Examples

${docs.examples}

## Troubleshooting

${docs.troubleshooting}

## Changelog

${docs.changelog}

---

*Generated automatically by MTYB Plugin Documentation Generator*
`;
  }

  // ============================================================================
  // Section Generators
  // ============================================================================

  private generateOverview(config: PluginConfig): string {
    return `## Overview

**Plugin ID:** \`${config.id}\`  
**Version:** \`${config.version}\`  
**Category:** \`${config.category}\`  
**Author:** ${config.author}  

### Description

${config.description}

### Features

- Automated order processing
- Real-time delivery
- Health monitoring
- Configuration validation
- Error handling and logging

### Requirements

- MTYB Virtual Goods Platform v1.0.0 or higher
- Valid plugin configuration
- Required API credentials (if applicable)
`;
  }

  private generateConfiguration(configFields: ConfigField[]): string {
    if (configFields.length === 0) {
      return `### Configuration Schema

This plugin does not require additional configuration beyond the basic plugin setup.

### Basic Setup

\`\`\`json
{
  "enabled": true,
  "metadata": {}
}
\`\`\`
`;
    }

    const configTable = configFields
      .map(field => {
        const required = field.required ? '✅' : '❌';
        const defaultValue =
          field.default !== undefined ? `\`${JSON.stringify(field.default)}\`` : 'N/A';
        return `| \`${field.name}\` | \`${field.type}\` | ${required} | ${field.description} | ${defaultValue} |`;
      })
      .join('\n');

    const exampleConfig = configFields.reduce((acc, field) => {
      acc[field.name] = field.example !== undefined ? field.example : field.default;
      return acc;
    }, {} as any);

    return `### Configuration Schema

| Field | Type | Required | Description | Default |
|-------|------|----------|-------------|---------|
${configTable}

### Example Configuration

\`\`\`json
${JSON.stringify(exampleConfig, null, 2)}
\`\`\`

### Configuration Validation

The plugin automatically validates configuration on initialization. Invalid configurations will prevent the plugin from starting.
`;
  }

  private generateUsage(config: PluginConfig): string {
    return `### Plugin Registration

\`\`\`typescript
import { pluginManager } from '@/core/plugin/PluginManager';
import { ${this.toPascalCase(config.id)}Plugin } from '@/plugins/${config.id}';

// Create plugin instance
const plugin = new ${this.toPascalCase(config.id)}Plugin();

// Register with plugin manager
await pluginManager.registerPlugin(plugin);

// Enable the plugin
await pluginManager.enablePlugin('${config.id}');
\`\`\`

### Product Configuration

Products using this plugin should have the following structure:

\`\`\`json
{
  "id": "product-id",
  "name": "Product Name",
  "pluginId": "${config.id}",
  "category": "${config.category}",
  "metadata": {
    // Plugin-specific product configuration
  }
}
\`\`\`

### Order Processing

Orders are automatically processed when payment is completed. The plugin will:

1. Validate the order and product configuration
2. Execute the delivery logic
3. Return delivery data to the customer
4. Log the transaction for audit purposes
`;
  }

  private generateAPI(plugin: BasePlugin): string {
    return `### Core Methods

#### \`initialize(config: Record<string, any>): Promise<void>\`

Initializes the plugin with the provided configuration.

**Parameters:**
- \`config\`: Plugin configuration object

**Throws:**
- Configuration validation errors
- Connection/setup errors

#### \`processOrder(context: PluginContext): Promise<DeliveryResult>\`

Processes an order and delivers the product to the customer.

**Parameters:**
- \`context\`: Plugin execution context containing order, product, and user data

**Returns:**
- \`DeliveryResult\`: Object containing delivery data and status

#### \`validateConfig(config: Record<string, any>): Promise<ValidationResult>\`

Validates plugin configuration.

**Parameters:**
- \`config\`: Configuration object to validate

**Returns:**
- \`ValidationResult\`: Validation status and error messages

#### \`validateProduct(productData: Record<string, any>): Promise<ValidationResult>\`

Validates product configuration for this plugin.

**Parameters:**
- \`productData\`: Product configuration to validate

**Returns:**
- \`ValidationResult\`: Validation status and error messages

### Optional Methods

#### \`healthCheck(): Promise<PluginHealthStatus>\`

Performs a health check on the plugin.

**Returns:**
- \`PluginHealthStatus\`: Health status information

#### \`cleanup(): Promise<void>\`

Cleans up resources when the plugin is disabled.

### Event Hooks

#### \`onOrderCreated(context: PluginContext): Promise<void>\`
Called when an order is created (before payment).

#### \`onPaymentCompleted(context: PluginContext): Promise<void>\`
Called when payment is completed successfully.

#### \`onOrderCancelled(context: PluginContext): Promise<void>\`
Called when an order is cancelled.

#### \`onRefundProcessed(context: PluginContext): Promise<void>\`
Called when a refund is processed.
`;
  }

  private generateExamples(config: PluginConfig, configFields: ConfigField[]): string {
    const basicExample = `### Basic Plugin Usage

\`\`\`typescript
import { ${this.toPascalCase(config.id)}Plugin } from '@/plugins/${config.id}';
import { mockDataGenerator } from '@/core/plugin/PluginDevTools';

// Create plugin instance
const plugin = new ${this.toPascalCase(config.id)}Plugin();

// Initialize plugin
await plugin.initialize({
  // Add your configuration here
});

// Create test context
const context = mockDataGenerator.createMockContext({
  product: {
    pluginId: '${config.id}',
    // Add product-specific configuration
  }
});

// Process order
const result = await plugin.processOrder(context);
console.log('Delivery result:', result);
\`\`\``;

    const configExample =
      configFields.length > 0
        ? `

### Configuration Example

\`\`\`typescript
const pluginConfig = {
${configFields.map(field => `  ${field.name}: ${JSON.stringify(field.example || field.default)}, // ${field.description}`).join('\n')}
};

await plugin.initialize(pluginConfig);
\`\`\``
        : '';

    const testingExample = `

### Testing Example

\`\`\`typescript
import { pluginTester } from '@/core/plugin/PluginDevTools';

// Validate plugin structure
const validation = await pluginTester.testPluginValidation(plugin);
console.log('Validation result:', validation);

// Test plugin execution
const executionTest = await pluginTester.testPluginExecution(plugin, context);
console.log('Execution test:', executionTest);

// Performance testing
const performanceTest = await pluginTester.testPluginPerformance(plugin, context, 10);
console.log('Performance test:', performanceTest);
\`\`\``;

    return basicExample + configExample + testingExample;
  }

  private generateTroubleshooting(config: PluginConfig): string {
    return `### Common Issues

#### Plugin fails to initialize

**Possible causes:**
- Invalid configuration
- Missing required fields
- Network connectivity issues
- Invalid API credentials

**Solutions:**
1. Validate your configuration using \`validateConfig()\`
2. Check all required fields are provided
3. Verify network connectivity
4. Confirm API credentials are correct

#### Order processing fails

**Possible causes:**
- Invalid product configuration
- Service API unavailable
- Insufficient permissions
- Rate limiting

**Solutions:**
1. Validate product configuration using \`validateProduct()\`
2. Check service API status
3. Verify API permissions
4. Implement retry logic with backoff

#### Health check fails

**Possible causes:**
- Service unavailable
- Network issues
- Authentication expired

**Solutions:**
1. Check service status
2. Verify network connectivity
3. Refresh authentication credentials

### Debug Mode

Enable debug logging to get detailed information:

\`\`\`typescript
import { logger } from '@/core/utils/Logger';
import { LogLevel } from '@/core/utils/Logger';

logger.setLevel(LogLevel.DEBUG);
\`\`\`

### Plugin Events

Monitor plugin events for debugging:

\`\`\`typescript
import { pluginEventEmitter } from '@/core/plugin/PluginEventEmitter';

pluginEventEmitter.on('plugin:error', (data) => {
  console.error('Plugin error:', data);
});

pluginEventEmitter.on('plugin:execution:error', (data) => {
  console.error('Execution error:', data);
});
\`\`\`
`;
  }

  private generateChangelog(config: PluginConfig): string {
    return `### Version ${config.version}

#### Added
- Initial plugin implementation
- Core functionality
- Configuration validation
- Health monitoring
- Error handling

#### Changed
- N/A

#### Fixed
- N/A

#### Removed
- N/A

### Future Versions

Features planned for future releases:
- Enhanced error handling
- Additional configuration options
- Performance optimizations
- Extended API support
`;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  // ============================================================================
  // Configuration Schema Analysis
  // ============================================================================

  analyzePluginConfiguration(plugin: BasePlugin): ConfigField[] {
    const fields: ConfigField[] = [];

    // Try to get configuration schema from plugin
    if (plugin.getConfigSchema) {
      const schema = plugin.getConfigSchema();

      Object.entries(schema).forEach(([key, value]: [string, any]) => {
        fields.push({
          name: key,
          type: value.type || 'string',
          required: value.required || false,
          description: value.description || `Configuration field: ${key}`,
          default: value.default,
          example: value.example,
        });
      });
    }

    return fields;
  }

  // ============================================================================
  // README Generator
  // ============================================================================

  generateReadme(plugin: BasePlugin): string {
    const config = plugin.config;
    const configFields = this.analyzePluginConfiguration(plugin);

    return `# ${config.name}

${config.description}

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Register the plugin
npm run plugin:register ${config.id}

# Enable the plugin
npm run plugin:enable ${config.id}
\`\`\`

## Documentation

For detailed documentation, see:
- [Configuration Guide](./docs/configuration.md)
- [API Reference](./docs/api.md)
- [Examples](./docs/examples.md)
- [Troubleshooting](./docs/troubleshooting.md)

## Plugin Information

- **ID:** \`${config.id}\`
- **Version:** \`${config.version}\`
- **Category:** \`${config.category}\`
- **Author:** ${config.author}

## License

This plugin is part of the MTYB Virtual Goods Platform.

## Support

For support and questions:
- Check the [troubleshooting guide](./docs/troubleshooting.md)
- Open an issue in the main repository
- Contact the plugin author: ${config.author}
`;
  }
}

// ============================================================================
// Global Documentation Generator Instance
// ============================================================================

export const pluginDocGenerator = new PluginDocumentationGenerator();
