import React, { useState, useEffect } from 'react';
import { Section, Cell, List, Badge, Button } from '@telegram-apps/telegram-ui';
import { Page } from '../../components/Page';
import { logger } from '../../core/utils/Logger';
import { pluginManager, demoPlugin, pluginTester, mockDataGenerator } from '../../core';

export const DemoPage: React.FC = () => {
  const [testStatus, setTestStatus] = useState('Ready');
  const [loggerTest, setLoggerTest] = useState('Ready');
  const [pluginManagerStatus, setPluginManagerStatus] = useState('Not Initialized');
  const [pluginTestStatus, setPluginTestStatus] = useState('Ready');
  const [pluginExecutionStatus, setPluginExecutionStatus] = useState('Ready');

  const handleBasicTest = () => {
    setTestStatus('Testing...');
    setTimeout(() => {
      setTestStatus('✅ Test Passed!');
    }, 1000);
  };

  const handleLoggerTest = () => {
    setLoggerTest('Testing...');
    try {
      logger.info('Demo page logger test');
      logger.debug('Debug message from demo');
      logger.warn('Warning message from demo');
      setLoggerTest('✅ Logger Working! Check console');
    } catch (error) {
      setLoggerTest('❌ Logger Error');
      console.error('Logger test failed:', error);
    }
  };

  const handlePluginManagerInit = async () => {
    setPluginManagerStatus('Initializing...');
    try {
      await pluginManager.initialize();
      setPluginManagerStatus('✅ Initialized');
      logger.info('Plugin Manager initialized successfully');
    } catch (error) {
      setPluginManagerStatus('❌ Failed to Initialize');
      logger.error('Plugin Manager initialization failed:', error as Error);
    }
  };

  const handlePluginTest = async () => {
    setPluginTestStatus('Testing...');
    try {
      // Test plugin validation
      const validationResult = await pluginTester.testPluginValidation(demoPlugin);

      if (validationResult.isValid) {
        // Register the plugin
        await pluginManager.registerPlugin(demoPlugin);

        // Enable the plugin
        await pluginManager.enablePlugin(demoPlugin.config.id);

        setPluginTestStatus('✅ Plugin Registered & Enabled');
        logger.info('Demo plugin test completed successfully');
      } else {
        setPluginTestStatus('❌ Plugin Validation Failed');
        logger.error(
          'Plugin validation failed:',
          new Error(validationResult.errors.map((e: any) => e.message).join(', '))
        );
      }
    } catch (error) {
      setPluginTestStatus('❌ Plugin Test Failed');
      logger.error('Plugin test failed:', error as Error);
    }
  };

  const handlePluginExecution = async () => {
    setPluginExecutionStatus('Executing...');
    try {
      // Create mock context
      const mockContext = mockDataGenerator.createMockContext();

      // Execute plugin
      const result = await pluginManager.executePlugin(demoPlugin.config.id, mockContext);

      if (result.success) {
        setPluginExecutionStatus('✅ Execution Successful');
        logger.info('Plugin execution successful:', result);
      } else {
        setPluginExecutionStatus('❌ Execution Failed');
        logger.error('Plugin execution failed:', new Error(result.error || 'Unknown error'));
      }
    } catch (error) {
      setPluginExecutionStatus('❌ Execution Error');
      logger.error('Plugin execution error:', error as Error);
    }
  };

  // Initialize plugin manager on component mount
  useEffect(() => {
    handlePluginManagerInit();
  }, []);

  return (
    <Page>
      <List>
        <Section
          header="MTYB Platform Demo"
          footer="This page demonstrates the core infrastructure components"
        >
          <Cell subtitle="Core architecture and components are ready">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Platform Status
              <Badge type="number" mode="primary">
                Ready
              </Badge>
            </div>
          </Cell>
        </Section>

        <Section header="Component Tests">
          <Cell
            subtitle="Simple test to verify the page loads"
            after={
              <Button size="s" mode="filled" onClick={handleBasicTest}>
                Test
              </Button>
            }
          >
            Basic Test: {testStatus}
          </Cell>

          <Cell
            subtitle="Test the logging system"
            after={
              <Button size="s" mode="outline" onClick={handleLoggerTest}>
                Test Logger
              </Button>
            }
          >
            Logger Test: {loggerTest}
          </Cell>
        </Section>

        <Section header="Plugin System Tests">
          <Cell subtitle="Plugin Manager initialization status">
            Plugin Manager: {pluginManagerStatus}
          </Cell>

          <Cell
            subtitle="Test demo plugin registration and validation"
            after={
              <Button
                size="s"
                mode="filled"
                onClick={handlePluginTest}
                disabled={pluginManagerStatus !== '✅ Initialized'}
              >
                Test Plugin
              </Button>
            }
          >
            Plugin Test: {pluginTestStatus}
          </Cell>

          <Cell
            subtitle="Execute demo plugin with mock data"
            after={
              <Button
                size="s"
                mode="outline"
                onClick={handlePluginExecution}
                disabled={pluginTestStatus !== '✅ Plugin Registered & Enabled'}
              >
                Execute
              </Button>
            }
          >
            Plugin Execution: {pluginExecutionStatus}
          </Cell>
        </Section>

        <Section header="Phase 1 Completed ✅">
          <Cell subtitle="Core types and interfaces are defined">
            User, Product, Order, Payment Types
          </Cell>
          <Cell subtitle="Plugin system interfaces defined">
            BasePlugin, PluginManager, Registry
          </Cell>
          <Cell subtitle="Utility classes implemented">
            Logger, Validator, ConfigManager, EventEmitter
          </Cell>
          <Cell subtitle="Environment configuration">Type-safe environment management</Cell>
          <Cell subtitle="Component library">Enhanced UI components</Cell>
        </Section>

        <Section header="Phase 2 Completed ✅">
          <Cell subtitle="Plugin Manager implemented">Core plugin management system</Cell>
          <Cell subtitle="Plugin Registry implemented">Plugin registration and discovery</Cell>
          <Cell subtitle="Plugin Event System implemented">Event-driven plugin communication</Cell>
          <Cell subtitle="Plugin Development Tools">Testing utilities and templates</Cell>
          <Cell subtitle="Demo Plugin created">Example plugin for testing</Cell>
        </Section>

        <Section header="Next Steps">
          <Cell subtitle="Phase 3: Payment Integration">⏳ Planned - Curlec Gateway</Cell>
          <Cell subtitle="Phase 4: Product Management">⏳ Planned - Product CRUD System</Cell>
          <Cell subtitle="Phase 5: Example Plugins">⏳ Planned - VPN, Netflix, etc.</Cell>
        </Section>
      </List>
    </Page>
  );
};

export default DemoPage;
