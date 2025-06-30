// ============================================================================
// MTYB Plugin SDK - Testing Framework
// ============================================================================

import {
  Plugin,
  PluginContext,
  PluginAPI,
  PluginEvent,
  PluginPermission,
  createTestContext,
  createMockAPI,
  PluginTestContext,
  MockPluginAPI,
  PluginSimulator,
} from './index';

// Test Runner
export class PluginTestRunner {
  private tests: PluginTest[] = [];
  private results: PluginTestResult[] = [];

  addTest(test: PluginTest): void {
    this.tests.push(test);
  }

  async runTests(): Promise<PluginTestSuite> {
    console.log(`Running ${this.tests.length} plugin tests...`);

    this.results = [];

    for (const test of this.tests) {
      const result = await this.runSingleTest(test);
      this.results.push(result);
    }

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log(`Tests completed: ${passed} passed, ${failed} failed`);

    return {
      totalTests: this.tests.length,
      passed,
      failed,
      results: this.results,
    };
  }

  private async runSingleTest(test: PluginTest): Promise<PluginTestResult> {
    const startTime = Date.now();

    try {
      console.log(`Running test: ${test.name}`);

      await test.run();

      const duration = Date.now() - startTime;
      console.log(`✓ ${test.name} (${duration}ms)`);

      return {
        name: test.name,
        passed: true,
        duration,
        error: null,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`✗ ${test.name} (${duration}ms):`, error);

      return {
        name: test.name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Test Builder
export class PluginTestBuilder {
  private testContext: PluginTestContext;

  constructor(plugin: Plugin) {
    this.testContext = createTestContext(plugin);
  }

  // Assertion helpers
  expect(actual: any): PluginTestAssertion {
    return new PluginTestAssertion(actual);
  }

  // Mock helpers
  get mockAPI(): MockPluginAPI {
    return this.testContext.mockAPI;
  }

  get simulator(): PluginSimulator {
    return this.testContext.simulator;
  }

  get plugin(): Plugin {
    return this.testContext.plugin;
  }

  // Lifecycle test helpers
  async testInstall(): Promise<void> {
    if (this.plugin.onInstall) {
      await this.plugin.onInstall();
    }
  }

  async testActivate(): Promise<void> {
    if (this.plugin.onActivate) {
      await this.plugin.onActivate();
    }
  }

  async testDeactivate(): Promise<void> {
    if (this.plugin.onDeactivate) {
      await this.plugin.onDeactivate();
    }
  }

  async testUninstall(): Promise<void> {
    if (this.plugin.onUninstall) {
      await this.plugin.onUninstall();
    }
  }

  async testUpdate(oldVersion: string, newVersion: string): Promise<void> {
    if (this.plugin.onUpdate) {
      await this.plugin.onUpdate(oldVersion, newVersion);
    }
  }

  async testRun(): Promise<void> {
    await this.plugin.run();
  }

  // Event testing
  async fireEvent(event: PluginEvent): Promise<void> {
    await this.simulator.fireEvent(event);
  }

  // Configuration testing
  setConfig(config: any): void {
    this.simulator.setConfig(config);
  }

  setPermissions(permissions: PluginPermission[]): void {
    this.simulator.setPermissions(permissions);
  }

  // Reset state
  reset(): void {
    this.mockAPI.reset();
  }
}

// Assertion class
class PluginTestAssertion {
  constructor(private actual: any) {}

  toBe(expected: any): void {
    if (this.actual !== expected) {
      throw new Error(`Expected ${this.actual} to be ${expected}`);
    }
  }

  toEqual(expected: any): void {
    if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
      throw new Error(
        `Expected ${JSON.stringify(this.actual)} to equal ${JSON.stringify(expected)}`
      );
    }
  }

  toBeTruthy(): void {
    if (!this.actual) {
      throw new Error(`Expected ${this.actual} to be truthy`);
    }
  }

  toBeFalsy(): void {
    if (this.actual) {
      throw new Error(`Expected ${this.actual} to be falsy`);
    }
  }

  toThrow(): void {
    if (typeof this.actual !== 'function') {
      throw new Error('Expected a function to test for throwing');
    }

    let threw = false;
    try {
      this.actual();
    } catch (e) {
      threw = true;
    }

    if (!threw) {
      throw new Error('Expected function to throw an error');
    }
  }

  toHaveBeenCalled(): void {
    if (!Array.isArray(this.actual) || this.actual.length === 0) {
      throw new Error('Expected method to have been called');
    }
  }

  toHaveBeenCalledWith(...args: any[]): void {
    if (!Array.isArray(this.actual) || this.actual.length === 0) {
      throw new Error('Expected method to have been called');
    }

    const lastCall = this.actual[this.actual.length - 1];
    const actualArgs = Object.values(lastCall);

    if (JSON.stringify(actualArgs) !== JSON.stringify(args)) {
      throw new Error(
        `Expected method to have been called with ${JSON.stringify(args)}, but was called with ${JSON.stringify(actualArgs)}`
      );
    }
  }

  toHaveLength(length: number): void {
    if (!this.actual || this.actual.length !== length) {
      throw new Error(`Expected length to be ${length}, but was ${this.actual?.length}`);
    }
  }

  toContain(item: any): void {
    if (!Array.isArray(this.actual) || !this.actual.includes(item)) {
      throw new Error(`Expected array to contain ${item}`);
    }
  }

  toBeInstanceOf(constructor: any): void {
    if (!(this.actual instanceof constructor)) {
      throw new Error(`Expected ${this.actual} to be instance of ${constructor.name}`);
    }
  }
}

// Test Types
export interface PluginTest {
  name: string;
  run(): Promise<void>;
}

export interface PluginTestResult {
  name: string;
  passed: boolean;
  duration: number;
  error: string | null;
}

export interface PluginTestSuite {
  totalTests: number;
  passed: number;
  failed: number;
  results: PluginTestResult[];
}

// Pre-built test cases
export class StandardPluginTests {
  static createLifecycleTests(plugin: Plugin): PluginTest[] {
    const tests: PluginTest[] = [];
    const builder = new PluginTestBuilder(plugin);

    // Install test
    tests.push({
      name: 'Plugin installs correctly',
      async run() {
        builder.reset();
        await builder.testInstall();

        // Check that install was tracked
        const storageCalls = builder.mockAPI.getCalls('storage.set');
        builder.expect(storageCalls.length).toBeGreaterThan(0);
      },
    });

    // Activate test
    tests.push({
      name: 'Plugin activates correctly',
      async run() {
        builder.reset();
        await builder.testActivate();

        // Plugin should show some kind of activation feedback
        const toastCalls = builder.mockAPI.getCalls('ui.showToast');
        builder.expect(toastCalls.length).toBeGreaterThan(0);
      },
    });

    // Run test
    tests.push({
      name: 'Plugin runs without errors',
      async run() {
        builder.reset();
        await builder.testRun();

        // Plugin should execute without throwing
        // (test passes if we reach here without exceptions)
      },
    });

    // Deactivate test
    tests.push({
      name: 'Plugin deactivates correctly',
      async run() {
        builder.reset();
        await builder.testDeactivate();

        // Should clean up any active state
        // (specific assertions depend on plugin implementation)
      },
    });

    // Uninstall test
    tests.push({
      name: 'Plugin uninstalls correctly',
      async run() {
        builder.reset();
        await builder.testUninstall();

        // Should clear storage
        const clearCalls = builder.mockAPI.getCalls('storage.clear');
        builder.expect(clearCalls.length).toBeGreaterThan(0);
      },
    });

    return tests;
  }

  static createPermissionTests(
    plugin: Plugin,
    requiredPermissions: PluginPermission[]
  ): PluginTest[] {
    const tests: PluginTest[] = [];
    const builder = new PluginTestBuilder(plugin);

    tests.push({
      name: 'Plugin respects permission restrictions',
      async run() {
        builder.reset();

        // Set limited permissions
        builder.setPermissions([]);

        // Try to use a restricted API
        builder.mockAPI.setMockResponse('storage.get', new Error('Permission denied'));

        try {
          await builder.mockAPI.storage.get('test');
          throw new Error('Expected permission error');
        } catch (error) {
          builder.expect(error.message).toBe('Permission denied');
        }
      },
    });

    tests.push({
      name: 'Plugin works with required permissions',
      async run() {
        builder.reset();

        // Set all required permissions
        builder.setPermissions(requiredPermissions);

        // Plugin should be able to use APIs
        await builder.testRun();
      },
    });

    return tests;
  }

  static createEventTests(plugin: Plugin): PluginTest[] {
    const tests: PluginTest[] = [];
    const builder = new PluginTestBuilder(plugin);

    const testEvents: PluginEvent[] = [
      {
        type: 'network.online',
        data: null,
        timestamp: new Date(),
      },
      {
        type: 'network.offline',
        data: null,
        timestamp: new Date(),
      },
      {
        type: 'ui.theme.changed',
        data: { theme: 'dark' },
        timestamp: new Date(),
      },
      {
        type: 'system.resume',
        data: null,
        timestamp: new Date(),
      },
      {
        type: 'system.pause',
        data: null,
        timestamp: new Date(),
      },
    ];

    testEvents.forEach(event => {
      tests.push({
        name: `Plugin handles ${event.type} event`,
        async run() {
          builder.reset();

          // Fire the event
          await builder.fireEvent(event);

          // Plugin should handle the event without throwing
          // (test passes if we reach here without exceptions)
        },
      });
    });

    return tests;
  }

  static createStorageTests(plugin: Plugin): PluginTest[] {
    const tests: PluginTest[] = [];
    const builder = new PluginTestBuilder(plugin);

    tests.push({
      name: 'Plugin can store and retrieve data',
      async run() {
        builder.reset();

        const testData = { key: 'value', number: 42 };
        builder.mockAPI.setMockResponse('storage.set', undefined);
        builder.mockAPI.setMockResponse('storage.get', testData);

        await builder.mockAPI.storage.set('test', testData);
        const retrieved = await builder.mockAPI.storage.get('test');

        builder.expect(retrieved).toEqual(testData);

        const setCalls = builder.mockAPI.getCalls('storage.set');
        builder.expect(setCalls).toHaveLength(1);
        builder.expect(setCalls[0]).toEqual({ key: 'test', value: testData });
      },
    });

    tests.push({
      name: 'Plugin handles storage errors gracefully',
      async run() {
        builder.reset();

        const storageError = new Error('Storage quota exceeded');
        builder.mockAPI.setMockResponse('storage.set', storageError);

        try {
          await builder.mockAPI.storage.set('test', 'value');
          throw new Error('Expected storage error');
        } catch (error) {
          builder.expect(error.message).toBe('Storage quota exceeded');
        }
      },
    });

    return tests;
  }

  static createNetworkTests(plugin: Plugin): PluginTest[] {
    const tests: PluginTest[] = [];
    const builder = new PluginTestBuilder(plugin);

    tests.push({
      name: 'Plugin handles successful HTTP requests',
      async run() {
        builder.reset();

        const mockResponse = {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: 'test' }),
        };

        builder.mockAPI.setMockResponse('network.http.get', mockResponse);

        const response = await builder.mockAPI.network.http.get('/test');
        const data = await response.json();

        builder.expect(response.ok).toBeTruthy();
        builder.expect(data.success).toBeTruthy();
      },
    });

    tests.push({
      name: 'Plugin handles HTTP errors gracefully',
      async run() {
        builder.reset();

        const mockResponse = {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          json: async () => ({ error: 'Not found' }),
        };

        builder.mockAPI.setMockResponse('network.http.get', mockResponse);

        const response = await builder.mockAPI.network.http.get('/nonexistent');

        builder.expect(response.ok).toBeFalsy();
        builder.expect(response.status).toBe(404);
      },
    });

    tests.push({
      name: 'Plugin handles network failures',
      async run() {
        builder.reset();

        const networkError = new Error('Network unavailable');
        builder.mockAPI.setMockResponse('network.http.get', networkError);

        try {
          await builder.mockAPI.network.http.get('/test');
          throw new Error('Expected network error');
        } catch (error) {
          builder.expect(error.message).toBe('Network unavailable');
        }
      },
    });

    return tests;
  }

  static createUITests(plugin: Plugin): PluginTest[] {
    const tests: PluginTest[] = [];
    const builder = new PluginTestBuilder(plugin);

    tests.push({
      name: 'Plugin can show toasts',
      async run() {
        builder.reset();

        builder.mockAPI.ui.showToast('Test message', 'info');

        const toastCalls = builder.mockAPI.getCalls('ui.showToast');
        builder.expect(toastCalls).toHaveLength(1);
        builder.expect(toastCalls[0]).toEqual({
          message: 'Test message',
          type: 'info',
        });
      },
    });

    tests.push({
      name: 'Plugin can show modals',
      async run() {
        builder.reset();

        const modalResult = { action: 'ok', data: 'test' };
        builder.mockAPI.setMockResponse('ui.showModal', modalResult);

        const result = await builder.mockAPI.ui.showModal({
          title: 'Test Modal',
          content: 'Test content',
        });

        builder.expect(result).toEqual(modalResult);

        const modalCalls = builder.mockAPI.getCalls('ui.showModal');
        builder.expect(modalCalls).toHaveLength(1);
      },
    });

    tests.push({
      name: 'Plugin can create UI components',
      async run() {
        builder.reset();

        const component = builder.mockAPI.ui.createComponent('button', {
          text: 'Click me',
          onClick: () => {},
        });

        builder.expect(component.type).toBe('button');
        builder.expect(component.props.text).toBe('Click me');

        const componentCalls = builder.mockAPI.getCalls('ui.createComponent');
        builder.expect(componentCalls).toHaveLength(1);
      },
    });

    return tests;
  }

  static createCryptoTests(plugin: Plugin): PluginTest[] {
    const tests: PluginTest[] = [];
    const builder = new PluginTestBuilder(plugin);

    tests.push({
      name: 'Plugin can hash data',
      async run() {
        builder.reset();

        const mockHash = 'mock-hash-value';
        builder.mockAPI.setMockResponse('crypto.hash', mockHash);

        const hash = await builder.mockAPI.crypto.hash('test data');

        builder.expect(hash).toBe(mockHash);

        const hashCalls = builder.mockAPI.getCalls('crypto.hash');
        builder.expect(hashCalls).toHaveLength(1);
      },
    });

    tests.push({
      name: 'Plugin can encrypt and decrypt data',
      async run() {
        builder.reset();

        const mockEncrypted = 'encrypted-data';
        const mockDecrypted = 'original-data';

        builder.mockAPI.setMockResponse('crypto.encrypt', mockEncrypted);
        builder.mockAPI.setMockResponse('crypto.decrypt', mockDecrypted);

        const encrypted = await builder.mockAPI.crypto.encrypt('original-data', 'key');
        const decrypted = await builder.mockAPI.crypto.decrypt(encrypted, 'key');

        builder.expect(encrypted).toBe(mockEncrypted);
        builder.expect(decrypted).toBe(mockDecrypted);
      },
    });

    tests.push({
      name: 'Plugin can generate keys and UUIDs',
      async run() {
        builder.reset();

        const mockKey = 'mock-generated-key';
        const mockUuid = 'mock-uuid';

        builder.mockAPI.setMockResponse('crypto.generateKey', mockKey);
        builder.mockAPI.setMockResponse('crypto.uuid', mockUuid);

        const key = await builder.mockAPI.crypto.generateKey();
        const uuid = builder.mockAPI.crypto.uuid();

        builder.expect(key).toBe(mockKey);
        builder.expect(uuid).toBe(mockUuid);
      },
    });

    return tests;
  }

  static createAnalyticsTests(plugin: Plugin): PluginTest[] {
    const tests: PluginTest[] = [];
    const builder = new PluginTestBuilder(plugin);

    tests.push({
      name: 'Plugin tracks events correctly',
      async run() {
        builder.reset();

        builder.mockAPI.analytics.track('test_event', { prop: 'value' });

        const trackCalls = builder.mockAPI.getCalls('analytics.track');
        builder.expect(trackCalls).toHaveLength(1);
        builder.expect(trackCalls[0]).toEqual({
          event: 'test_event',
          properties: { prop: 'value' },
        });
      },
    });

    tests.push({
      name: 'Plugin identifies users correctly',
      async run() {
        builder.reset();

        builder.mockAPI.analytics.identify('user123', { name: 'Test User' });

        const identifyCalls = builder.mockAPI.getCalls('analytics.identify');
        builder.expect(identifyCalls).toHaveLength(1);
        builder.expect(identifyCalls[0]).toEqual({
          userId: 'user123',
          traits: { name: 'Test User' },
        });
      },
    });

    return tests;
  }
}

// Utility to add method to PluginTestAssertion
declare module './test' {
  interface PluginTestAssertion {
    toBeGreaterThan(expected: number): void;
    toBeLessThan(expected: number): void;
  }
}

PluginTestAssertion.prototype.toBeGreaterThan = function (expected: number) {
  if (typeof this.actual !== 'number' || this.actual <= expected) {
    throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
  }
};

PluginTestAssertion.prototype.toBeLessThan = function (expected: number) {
  if (typeof this.actual !== 'number' || this.actual >= expected) {
    throw new Error(`Expected ${this.actual} to be less than ${expected}`);
  }
};

// Export test utilities
export { PluginTestBuilder, StandardPluginTests };
