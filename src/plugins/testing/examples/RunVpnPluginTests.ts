// ============================================================================
// MTYB Virtual Goods Platform - VPN Plugin Testing Example
// ============================================================================

import { pluginTestRunner, testReportGenerator } from '../index';
import { vpnPlugin } from '../../vpn/VpnPlugin';
import type { ReportOptions } from '../TestReportGenerator';

// ============================================================================
// Example: How to test a plugin
// ============================================================================

export async function runVpnPluginTests(): Promise<void> {
  console.log('🧪 Starting VPN Plugin Tests...\n');

  try {
    // Initialize the plugin first
    if (!vpnPlugin.isInitialized) {
      console.log('⚙️ Initializing VPN Plugin...');
      await vpnPlugin.initialize();
      console.log('✅ VPN Plugin initialized successfully\n');
    }

    // Run all test suites for the VPN plugin
    console.log('🔄 Running all test suites...');
    const testReports = await pluginTestRunner.runAllTestSuites(vpnPlugin);

    // Generate reports in different formats
    const reportOptions: ReportOptions = {
      format: 'console',
      includeDetails: true,
      includePerformanceMetrics: true,
      includeRecommendations: true,
    };

    console.log('\n📊 Test Results:\n');

    // Display console report for each test suite
    for (const report of testReports) {
      const consoleReport = testReportGenerator.generateSingleReport(report, reportOptions);
      console.log(consoleReport);
    }

    // Generate consolidated report
    const consolidatedReport = testReportGenerator.generateConsolidatedReport(testReports, {
      ...reportOptions,
      format: 'markdown',
    });

    console.log('\n📋 Consolidated Report (Markdown format):');
    console.log('='.repeat(80));
    console.log(consolidatedReport);

    // Generate HTML report (for file output)
    const htmlReport = testReportGenerator.generateConsolidatedReport(testReports, {
      ...reportOptions,
      format: 'html',
      theme: 'telegram',
    });

    // In a real application, you would save this to a file
    console.log('\n💾 HTML report generated (would be saved to file in production)');
    console.log(`HTML report length: ${htmlReport.length} characters`);

    // Summary
    const totalTests = testReports.reduce((sum, r) => sum + r.totalTests, 0);
    const totalPassed = testReports.reduce((sum, r) => sum + r.passedTests, 0);
    const totalFailed = testReports.reduce((sum, r) => sum + r.failedTests, 0);
    const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

    console.log('\n' + '='.repeat(80));
    console.log('🏁 TESTING COMPLETE');
    console.log('='.repeat(80));
    console.log(`📊 Results: ${totalPassed}/${totalTests} tests passed (${passRate}%)`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(
      `⏱️ Total Duration: ${testReports.reduce((sum, r) => sum + r.totalDuration, 0).toFixed(0)}ms`
    );

    const criticalIssues = testReports.reduce((sum, r) => sum + r.summary.criticalIssues, 0);
    if (criticalIssues > 0) {
      console.log(`🚨 Critical Issues: ${criticalIssues} - Review required before production!`);
    } else {
      console.log('✅ No critical issues found');
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    throw error;
  }
}

// ============================================================================
// Example: Custom test suite for VPN plugin
// ============================================================================

export function createVpnSpecificTestSuite() {
  return {
    id: 'vpn-specific-tests',
    name: 'VPN Plugin Specific Tests',
    description: 'Tests specific to VPN plugin functionality',
    testCases: [
      {
        id: 'vpn-server-validation',
        name: 'VPN Server Configuration Validation',
        description: 'Test VPN server configuration validation',
        category: 'validation' as const,
        priority: 'high' as const,
        timeout: 5000,
        execute: async (plugin: any, context: any) => {
          const startTime = performance.now();

          try {
            // Test with valid VPN configuration
            const validProduct = context.helpers.createMockProduct('vpn', {
              serverRegions: ['us-east', 'eu-west'],
              protocols: ['openvpn', 'wireguard'],
              maxConnections: 5,
            });

            const validationResult = await plugin.validateOrder({
              product: validProduct,
              order: context.mockData.order,
              user: context.mockData.user,
            });

            const duration = performance.now() - startTime;

            return {
              success: validationResult.isValid,
              duration,
              message: validationResult.isValid
                ? 'VPN configuration validation passed'
                : `VPN validation failed: ${validationResult.errors.map((e: any) => e.message).join(', ')}`,
              data: validationResult,
            };
          } catch (error) {
            return {
              success: false,
              duration: performance.now() - startTime,
              error: error as Error,
              message: 'VPN validation test threw error',
            };
          }
        },
      },

      {
        id: 'vpn-account-creation',
        name: 'VPN Account Creation Test',
        description: 'Test VPN account creation and configuration generation',
        category: 'delivery' as const,
        priority: 'critical' as const,
        timeout: 15000,
        execute: async (plugin: any, context: any) => {
          const startTime = performance.now();

          try {
            const vpnProduct = context.helpers.createMockProduct('vpn', {
              serverRegions: ['us-east'],
              protocols: ['openvpn'],
              maxConnections: 3,
              accountDuration: 30,
            });

            const deliveryResult = await plugin.processDelivery({
              product: vpnProduct,
              order: context.helpers.createMockOrder(vpnProduct.id, 1),
              user: context.mockData.user,
            });

            const duration = performance.now() - startTime;

            if (!deliveryResult.success) {
              return {
                success: false,
                duration,
                message: `VPN delivery failed: ${deliveryResult.error}`,
                data: deliveryResult,
              };
            }

            // Validate delivery data structure
            const deliveryData = deliveryResult.deliveryData;
            const validationIssues: string[] = [];

            if (
              !deliveryData.accounts ||
              !Array.isArray(deliveryData.accounts) ||
              deliveryData.accounts.length === 0
            ) {
              validationIssues.push('No VPN accounts created');
            }

            if (
              !deliveryData.configs ||
              !Array.isArray(deliveryData.configs) ||
              deliveryData.configs.length === 0
            ) {
              validationIssues.push('No VPN configurations generated');
            }

            if (!deliveryData.instructions || typeof deliveryData.instructions !== 'string') {
              validationIssues.push('No setup instructions provided');
            }

            // Check account structure
            if (deliveryData.accounts && deliveryData.accounts.length > 0) {
              const account = deliveryData.accounts[0];
              if (!account.username || !account.password || !account.serverId) {
                validationIssues.push('VPN account missing required fields');
              }
            }

            // Check config structure
            if (deliveryData.configs && deliveryData.configs.length > 0) {
              const config = deliveryData.configs[0];
              if (!config.configData || !config.downloadUrl) {
                validationIssues.push('VPN configuration missing required fields');
              }
            }

            return {
              success: validationIssues.length === 0,
              duration,
              message:
                validationIssues.length === 0
                  ? `VPN account created successfully with ${deliveryData.accounts.length} account(s) and ${deliveryData.configs.length} config(s)`
                  : `VPN delivery validation issues: ${validationIssues.join(', ')}`,
              data: deliveryResult,
              warnings: validationIssues.length > 0 ? validationIssues : undefined,
            };
          } catch (error) {
            return {
              success: false,
              duration: performance.now() - startTime,
              error: error as Error,
              message: 'VPN account creation test threw error',
            };
          }
        },
      },

      {
        id: 'vpn-configuration-formats',
        name: 'VPN Configuration Format Test',
        description: 'Test different VPN configuration formats (OpenVPN, WireGuard)',
        category: 'delivery' as const,
        priority: 'medium' as const,
        timeout: 10000,
        execute: async (plugin: any, context: any) => {
          const startTime = performance.now();
          const protocols = ['openvpn', 'wireguard'];
          const results: any[] = [];

          try {
            for (const protocol of protocols) {
              const vpnProduct = context.helpers.createMockProduct('vpn', {
                serverRegions: ['us-east'],
                protocols: [protocol],
                maxConnections: 1,
              });

              const deliveryResult = await plugin.processDelivery({
                product: vpnProduct,
                order: context.helpers.createMockOrder(vpnProduct.id, 1),
                user: context.mockData.user,
              });

              results.push({
                protocol,
                success: deliveryResult.success,
                hasConfig: deliveryResult.deliveryData?.configs?.length > 0,
                configData: deliveryResult.deliveryData?.configs?.[0]?.configData,
              });
            }

            const duration = performance.now() - startTime;
            const successfulProtocols = results.filter(r => r.success && r.hasConfig).length;

            return {
              success: successfulProtocols === protocols.length,
              duration,
              message: `VPN configuration test: ${successfulProtocols}/${protocols.length} protocols generated configs successfully`,
              data: results,
              warnings:
                successfulProtocols < protocols.length
                  ? ['Some VPN protocols failed to generate configurations']
                  : undefined,
            };
          } catch (error) {
            return {
              success: false,
              duration: performance.now() - startTime,
              error: error as Error,
              message: 'VPN configuration format test threw error',
            };
          }
        },
      },
    ],
  };
}

// ============================================================================
// Example: Running custom test suite
// ============================================================================

export async function runCustomVpnTests(): Promise<void> {
  console.log('🧪 Running Custom VPN Tests...\n');

  try {
    // Add custom test suite
    const customTestSuite = createVpnSpecificTestSuite();
    pluginTestRunner.addTestSuite(customTestSuite);

    // Initialize plugin
    if (!vpnPlugin.isInitialized) {
      await vpnPlugin.initialize();
    }

    // Run custom test suite
    const testReport = await pluginTestRunner.runTestSuite(vpnPlugin, customTestSuite.id);

    // Generate report
    const reportOptions: ReportOptions = {
      format: 'console',
      includeDetails: true,
      includePerformanceMetrics: false,
      includeRecommendations: true,
    };

    const consoleReport = testReportGenerator.generateSingleReport(testReport, reportOptions);
    console.log(consoleReport);
  } catch (error) {
    console.error('❌ Custom VPN test execution failed:', error);
    throw error;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

if (require.main === module) {
  (async () => {
    try {
      // Run standard tests
      await runVpnPluginTests();

      console.log('\n' + '='.repeat(80));
      console.log('🔬 Running Custom VPN-Specific Tests');
      console.log('='.repeat(80));

      // Run custom tests
      await runCustomVpnTests();
    } catch (error) {
      console.error('Test execution failed:', error);
      process.exit(1);
    }
  })();
}
