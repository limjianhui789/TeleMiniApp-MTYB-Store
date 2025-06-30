// ============================================================================
// MTYB Virtual Goods Platform - Test Report Generator
// ============================================================================

import type { TestReport, TestResult } from './PluginTestRunner';
import { Logger } from '../core/utils/Logger';

// ============================================================================
// Report Generation Types
// ============================================================================

export interface ReportOptions {
  format: 'html' | 'json' | 'markdown' | 'console';
  includeDetails: boolean;
  includePerformanceMetrics: boolean;
  includeRecommendations: boolean;
  theme?: 'light' | 'dark' | 'telegram';
}

export interface ConsolidatedReport {
  overallSummary: {
    totalPlugins: number;
    totalTestSuites: number;
    totalTests: number;
    overallPassRate: number;
    criticalIssuesCount: number;
    performanceIssuesCount: number;
    executionDate: Date;
    totalDuration: number;
  };
  pluginReports: TestReport[];
  recommendations: string[];
  performanceAnalysis: {
    slowestTests: Array<{
      pluginId: string;
      testId: string;
      testName: string;
      duration: number;
    }>;
    memoryIntensiveTests: Array<{
      pluginId: string;
      testId: string;
      testName: string;
      memoryUsage: number;
    }>;
    averageResponseTimes: Record<string, number>;
  };
}

// ============================================================================
// Test Report Generator
// ============================================================================

export class TestReportGenerator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('TestReportGenerator');
  }

  // ========================================================================
  // Main Report Generation Methods
  // ========================================================================

  generateSingleReport(report: TestReport, options: ReportOptions): string {
    this.logger.info('Generating single test report', {
      pluginId: report.pluginId,
      format: options.format,
    });

    switch (options.format) {
      case 'html':
        return this.generateHtmlReport(report, options);
      case 'json':
        return this.generateJsonReport(report, options);
      case 'markdown':
        return this.generateMarkdownReport(report, options);
      case 'console':
        return this.generateConsoleReport(report, options);
      default:
        throw new Error(`Unsupported report format: ${options.format}`);
    }
  }

  generateConsolidatedReport(reports: TestReport[], options: ReportOptions): string {
    this.logger.info('Generating consolidated test report', {
      reportCount: reports.length,
      format: options.format,
    });

    const consolidated = this.consolidateReports(reports);

    switch (options.format) {
      case 'html':
        return this.generateConsolidatedHtmlReport(consolidated, options);
      case 'json':
        return JSON.stringify(consolidated, null, 2);
      case 'markdown':
        return this.generateConsolidatedMarkdownReport(consolidated, options);
      case 'console':
        return this.generateConsolidatedConsoleReport(consolidated, options);
      default:
        throw new Error(`Unsupported report format: ${options.format}`);
    }
  }

  // ========================================================================
  // HTML Report Generation
  // ========================================================================

  private generateHtmlReport(report: TestReport, options: ReportOptions): string {
    const theme = options.theme || 'light';
    const styles = this.getHtmlStyles(theme);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plugin Test Report - ${report.pluginName}</title>
    <style>${styles}</style>
</head>
<body>
    <div class="container">
        ${this.generateHtmlHeader(report)}
        ${this.generateHtmlSummary(report)}
        ${options.includeDetails ? this.generateHtmlTestDetails(report) : ''}
        ${options.includePerformanceMetrics ? this.generateHtmlPerformanceMetrics(report) : ''}
        ${options.includeRecommendations ? this.generateHtmlRecommendations(report) : ''}
    </div>
</body>
</html>`;
  }

  private generateHtmlHeader(report: TestReport): string {
    const statusClass = report.summary.overallStatus;
    const statusIcon = {
      passed: '✅',
      warning: '⚠️',
      failed: '❌',
    }[statusClass];

    return `
<header class="header">
    <div class="header-content">
        <h1>Plugin Test Report</h1>
        <div class="plugin-info">
            <h2>${report.pluginName} v${report.pluginVersion}</h2>
            <div class="status-badge ${statusClass}">
                ${statusIcon} ${report.summary.overallStatus.toUpperCase()}
            </div>
        </div>
        <div class="execution-info">
            <p><strong>Executed:</strong> ${report.executionDate.toLocaleString()}</p>
            <p><strong>Duration:</strong> ${this.formatDuration(report.totalDuration)}</p>
            <p><strong>Test Suite:</strong> ${report.testSuiteId}</p>
        </div>
    </div>
</header>`;
  }

  private generateHtmlSummary(report: TestReport): string {
    const passRate = ((report.passedTests / report.totalTests) * 100).toFixed(1);

    return `
<section class="summary">
    <h3>Test Summary</h3>
    <div class="summary-grid">
        <div class="summary-card">
            <div class="summary-number">${report.totalTests}</div>
            <div class="summary-label">Total Tests</div>
        </div>
        <div class="summary-card passed">
            <div class="summary-number">${report.passedTests}</div>
            <div class="summary-label">Passed</div>
        </div>
        <div class="summary-card failed">
            <div class="summary-number">${report.failedTests}</div>
            <div class="summary-label">Failed</div>
        </div>
        <div class="summary-card">
            <div class="summary-number">${passRate}%</div>
            <div class="summary-label">Pass Rate</div>
        </div>
    </div>
    
    ${
      report.summary.criticalIssues > 0
        ? `
    <div class="alert critical">
        <strong>⚠️ Critical Issues:</strong> ${report.summary.criticalIssues} critical test(s) failed
    </div>`
        : ''
    }
    
    ${
      report.summary.performanceIssues > 0
        ? `
    <div class="alert warning">
        <strong>🐌 Performance Issues:</strong> ${report.summary.performanceIssues} test(s) with performance concerns
    </div>`
        : ''
    }
</section>`;
  }

  private generateHtmlTestDetails(report: TestReport): string {
    const testRows = report.results
      .map(result => {
        const statusIcon = result.result.success ? '✅' : '❌';
        const statusClass = result.result.success ? 'passed' : 'failed';
        const duration = result.result.duration ? `${result.result.duration.toFixed(2)}ms` : 'N/A';

        return `
<tr class="test-row ${statusClass}">
    <td>${statusIcon}</td>
    <td>${result.testName}</td>
    <td>${duration}</td>
    <td class="test-message">${result.result.message || ''}</td>
</tr>`;
      })
      .join('');

    return `
<section class="test-details">
    <h3>Test Details</h3>
    <table class="test-table">
        <thead>
            <tr>
                <th>Status</th>
                <th>Test Name</th>
                <th>Duration</th>
                <th>Message</th>
            </tr>
        </thead>
        <tbody>
            ${testRows}
        </tbody>
    </table>
</section>`;
  }

  private generateHtmlPerformanceMetrics(report: TestReport): string {
    const performanceData = report.results
      .filter(r => r.result.performance)
      .map(r => ({
        testName: r.testName,
        responseTime: r.result.performance!.responseTime,
        memoryUsage: r.result.performance!.memoryUsage,
      }));

    if (performanceData.length === 0) {
      return '';
    }

    const chartData = performanceData.map(d => `['${d.testName}', ${d.responseTime}]`).join(', ');

    return `
<section class="performance-metrics">
    <h3>Performance Metrics</h3>
    <div class="metrics-grid">
        <div class="metric-card">
            <h4>Average Response Time</h4>
            <div class="metric-value">
                ${(performanceData.reduce((sum, d) => sum + d.responseTime, 0) / performanceData.length).toFixed(2)}ms
            </div>
        </div>
        <div class="metric-card">
            <h4>Total Memory Usage</h4>
            <div class="metric-value">
                ${performanceData.reduce((sum, d) => sum + d.memoryUsage, 0).toFixed(2)}MB
            </div>
        </div>
    </div>
    
    <div class="chart-container">
        <canvas id="performanceChart" width="400" height="200"></canvas>
    </div>
    
    <script>
        // Simple performance chart
        const canvas = document.getElementById('performanceChart');
        const ctx = canvas.getContext('2d');
        const data = [${chartData}];
        
        // Basic bar chart implementation
        const maxValue = Math.max(...data.map(d => d[1]));
        const barWidth = canvas.width / data.length;
        
        data.forEach((item, index) => {
            const barHeight = (item[1] / maxValue) * (canvas.height - 40);
            const x = index * barWidth + 10;
            const y = canvas.height - barHeight - 20;
            
            ctx.fillStyle = '#007AFF';
            ctx.fillRect(x, y, barWidth - 20, barHeight);
            
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.fillText(item[1].toFixed(0) + 'ms', x, y - 5);
        });
    </script>
</section>`;
  }

  private generateHtmlRecommendations(report: TestReport): string {
    if (report.summary.recommendations.length === 0) {
      return `
<section class="recommendations">
    <h3>Recommendations</h3>
    <div class="alert success">
        <strong>✅ Great job!</strong> No specific recommendations at this time.
    </div>
</section>`;
    }

    const recommendationItems = report.summary.recommendations
      .map(rec => `<li>${rec}</li>`)
      .join('');

    return `
<section class="recommendations">
    <h3>Recommendations</h3>
    <ul class="recommendation-list">
        ${recommendationItems}
    </ul>
</section>`;
  }

  // ========================================================================
  // Markdown Report Generation
  // ========================================================================

  private generateMarkdownReport(report: TestReport, options: ReportOptions): string {
    const statusEmoji = {
      passed: '✅',
      warning: '⚠️',
      failed: '❌',
    }[report.summary.overallStatus];

    let markdown = `# Plugin Test Report\n\n`;
    markdown += `## ${report.pluginName} v${report.pluginVersion} ${statusEmoji}\n\n`;
    markdown += `**Execution Date:** ${report.executionDate.toLocaleString()}\n`;
    markdown += `**Duration:** ${this.formatDuration(report.totalDuration)}\n`;
    markdown += `**Test Suite:** ${report.testSuiteId}\n\n`;

    // Summary
    const passRate = ((report.passedTests / report.totalTests) * 100).toFixed(1);
    markdown += `## Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Total Tests | ${report.totalTests} |\n`;
    markdown += `| Passed | ${report.passedTests} |\n`;
    markdown += `| Failed | ${report.failedTests} |\n`;
    markdown += `| Pass Rate | ${passRate}% |\n`;
    markdown += `| Critical Issues | ${report.summary.criticalIssues} |\n`;
    markdown += `| Performance Issues | ${report.summary.performanceIssues} |\n\n`;

    // Test Details
    if (options.includeDetails) {
      markdown += `## Test Results\n\n`;
      markdown += `| Status | Test Name | Duration | Message |\n`;
      markdown += `|--------|-----------|----------|----------|\n`;

      report.results.forEach(result => {
        const status = result.result.success ? '✅' : '❌';
        const duration = result.result.duration ? `${result.result.duration.toFixed(2)}ms` : 'N/A';
        const message = (result.result.message || '').replace(/\|/g, '\\|');

        markdown += `| ${status} | ${result.testName} | ${duration} | ${message} |\n`;
      });
      markdown += `\n`;
    }

    // Recommendations
    if (options.includeRecommendations && report.summary.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      report.summary.recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += `\n`;
    }

    return markdown;
  }

  // ========================================================================
  // Console Report Generation
  // ========================================================================

  private generateConsoleReport(report: TestReport, options: ReportOptions): string {
    const colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      bold: '\x1b[1m',
      reset: '\x1b[0m',
    };

    const statusColor = {
      passed: colors.green,
      warning: colors.yellow,
      failed: colors.red,
    }[report.summary.overallStatus];

    let output = '';
    output += `\n${colors.bold}=== Plugin Test Report ===${colors.reset}\n`;
    output += `${colors.blue}Plugin:${colors.reset} ${report.pluginName} v${report.pluginVersion}\n`;
    output += `${colors.blue}Status:${colors.reset} ${statusColor}${report.summary.overallStatus.toUpperCase()}${colors.reset}\n`;
    output += `${colors.blue}Executed:${colors.reset} ${report.executionDate.toLocaleString()}\n`;
    output += `${colors.blue}Duration:${colors.reset} ${this.formatDuration(report.totalDuration)}\n`;
    output += `${colors.blue}Test Suite:${colors.reset} ${report.testSuiteId}\n\n`;

    // Summary
    const passRate = ((report.passedTests / report.totalTests) * 100).toFixed(1);
    output += `${colors.bold}Summary:${colors.reset}\n`;
    output += `  Total Tests: ${report.totalTests}\n`;
    output += `  ${colors.green}Passed: ${report.passedTests}${colors.reset}\n`;
    output += `  ${colors.red}Failed: ${report.failedTests}${colors.reset}\n`;
    output += `  Pass Rate: ${passRate}%\n`;

    if (report.summary.criticalIssues > 0) {
      output += `  ${colors.red}Critical Issues: ${report.summary.criticalIssues}${colors.reset}\n`;
    }

    if (report.summary.performanceIssues > 0) {
      output += `  ${colors.yellow}Performance Issues: ${report.summary.performanceIssues}${colors.reset}\n`;
    }

    output += `\n`;

    // Test Details
    if (options.includeDetails) {
      output += `${colors.bold}Test Results:${colors.reset}\n`;
      report.results.forEach(result => {
        const statusIcon = result.result.success
          ? `${colors.green}✓${colors.reset}`
          : `${colors.red}✗${colors.reset}`;
        const duration = result.result.duration ? ` (${result.result.duration.toFixed(2)}ms)` : '';
        output += `  ${statusIcon} ${result.testName}${duration}\n`;

        if (result.result.message) {
          output += `    ${result.result.message}\n`;
        }

        if (result.result.error) {
          output += `    ${colors.red}Error: ${result.result.error.message}${colors.reset}\n`;
        }
      });
      output += `\n`;
    }

    // Recommendations
    if (options.includeRecommendations && report.summary.recommendations.length > 0) {
      output += `${colors.bold}Recommendations:${colors.reset}\n`;
      report.summary.recommendations.forEach(rec => {
        output += `  • ${rec}\n`;
      });
      output += `\n`;
    }

    return output;
  }

  // ========================================================================
  // JSON Report Generation
  // ========================================================================

  private generateJsonReport(report: TestReport, options: ReportOptions): string {
    const jsonReport = {
      ...report,
      metadata: {
        generatedAt: new Date(),
        reportOptions: options,
        formatVersion: '1.0.0',
      },
    };

    if (!options.includeDetails) {
      delete (jsonReport as any).results;
    }

    return JSON.stringify(jsonReport, null, 2);
  }

  // ========================================================================
  // Consolidated Report Methods
  // ========================================================================

  private consolidateReports(reports: TestReport[]): ConsolidatedReport {
    const totalTests = reports.reduce((sum, r) => sum + r.totalTests, 0);
    const totalPassed = reports.reduce((sum, r) => sum + r.passedTests, 0);
    const totalDuration = reports.reduce((sum, r) => sum + r.totalDuration, 0);
    const criticalIssues = reports.reduce((sum, r) => sum + r.summary.criticalIssues, 0);
    const performanceIssues = reports.reduce((sum, r) => sum + r.summary.performanceIssues, 0);

    // Analyze performance
    const allTestResults = reports.flatMap(r =>
      r.results.map(result => ({
        pluginId: r.pluginId,
        testId: result.testId,
        testName: result.testName,
        duration: result.result.duration || 0,
        memoryUsage: result.result.performance?.memoryUsage || 0,
      }))
    );

    const slowestTests = allTestResults.sort((a, b) => b.duration - a.duration).slice(0, 10);

    const memoryIntensiveTests = allTestResults
      .filter(t => t.memoryUsage > 0)
      .sort((a, b) => b.memoryUsage - a.memoryUsage)
      .slice(0, 10);

    const averageResponseTimes: Record<string, number> = {};
    reports.forEach(report => {
      const avgTime =
        report.results.reduce((sum, r) => sum + (r.result.duration || 0), 0) /
        report.results.length;
      averageResponseTimes[report.pluginId] = avgTime;
    });

    // Consolidate recommendations
    const allRecommendations = new Set<string>();
    reports.forEach(r => r.summary.recommendations.forEach(rec => allRecommendations.add(rec)));

    return {
      overallSummary: {
        totalPlugins: reports.length,
        totalTestSuites: new Set(reports.map(r => r.testSuiteId)).size,
        totalTests,
        overallPassRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
        criticalIssuesCount: criticalIssues,
        performanceIssuesCount: performanceIssues,
        executionDate: new Date(),
        totalDuration,
      },
      pluginReports: reports,
      recommendations: Array.from(allRecommendations),
      performanceAnalysis: {
        slowestTests,
        memoryIntensiveTests,
        averageResponseTimes,
      },
    };
  }

  private generateConsolidatedMarkdownReport(
    consolidated: ConsolidatedReport,
    options: ReportOptions
  ): string {
    let markdown = `# Consolidated Plugin Test Report\n\n`;
    markdown += `**Generated:** ${consolidated.overallSummary.executionDate.toLocaleString()}\n`;
    markdown += `**Total Duration:** ${this.formatDuration(consolidated.overallSummary.totalDuration)}\n\n`;

    // Overall Summary
    markdown += `## Overall Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `|--------|-------|\n`;
    markdown += `| Plugins Tested | ${consolidated.overallSummary.totalPlugins} |\n`;
    markdown += `| Test Suites | ${consolidated.overallSummary.totalTestSuites} |\n`;
    markdown += `| Total Tests | ${consolidated.overallSummary.totalTests} |\n`;
    markdown += `| Overall Pass Rate | ${consolidated.overallSummary.overallPassRate.toFixed(1)}% |\n`;
    markdown += `| Critical Issues | ${consolidated.overallSummary.criticalIssuesCount} |\n`;
    markdown += `| Performance Issues | ${consolidated.overallSummary.performanceIssuesCount} |\n\n`;

    // Plugin Results Summary
    markdown += `## Plugin Results\n\n`;
    markdown += `| Plugin | Version | Tests | Passed | Failed | Status |\n`;
    markdown += `|--------|---------|-------|--------|--------|---------|\n`;

    consolidated.pluginReports.forEach(report => {
      const statusEmoji = {
        passed: '✅',
        warning: '⚠️',
        failed: '❌',
      }[report.summary.overallStatus];

      markdown += `| ${report.pluginName} | ${report.pluginVersion} | ${report.totalTests} | ${report.passedTests} | ${report.failedTests} | ${statusEmoji} |\n`;
    });
    markdown += `\n`;

    // Performance Analysis
    if (options.includePerformanceMetrics) {
      markdown += `## Performance Analysis\n\n`;

      markdown += `### Slowest Tests\n\n`;
      markdown += `| Plugin | Test | Duration |\n`;
      markdown += `|--------|------|----------|\n`;
      consolidated.performanceAnalysis.slowestTests.slice(0, 5).forEach(test => {
        markdown += `| ${test.pluginId} | ${test.testName} | ${test.duration.toFixed(2)}ms |\n`;
      });
      markdown += `\n`;

      markdown += `### Average Response Times by Plugin\n\n`;
      markdown += `| Plugin | Average Response Time |\n`;
      markdown += `|--------|-----------------------|\n`;
      Object.entries(consolidated.performanceAnalysis.averageResponseTimes).forEach(
        ([pluginId, avgTime]) => {
          markdown += `| ${pluginId} | ${avgTime.toFixed(2)}ms |\n`;
        }
      );
      markdown += `\n`;
    }

    // Recommendations
    if (options.includeRecommendations && consolidated.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      consolidated.recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += `\n`;
    }

    return markdown;
  }

  private generateConsolidatedConsoleReport(
    consolidated: ConsolidatedReport,
    options: ReportOptions
  ): string {
    const colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      bold: '\x1b[1m',
      reset: '\x1b[0m',
    };

    let output = '';
    output += `\n${colors.bold}=== Consolidated Plugin Test Report ===${colors.reset}\n`;
    output += `${colors.blue}Generated:${colors.reset} ${consolidated.overallSummary.executionDate.toLocaleString()}\n`;
    output += `${colors.blue}Total Duration:${colors.reset} ${this.formatDuration(consolidated.overallSummary.totalDuration)}\n\n`;

    // Overall Summary
    output += `${colors.bold}Overall Summary:${colors.reset}\n`;
    output += `  Plugins Tested: ${consolidated.overallSummary.totalPlugins}\n`;
    output += `  Test Suites: ${consolidated.overallSummary.totalTestSuites}\n`;
    output += `  Total Tests: ${consolidated.overallSummary.totalTests}\n`;
    output += `  Overall Pass Rate: ${consolidated.overallSummary.overallPassRate.toFixed(1)}%\n`;

    if (consolidated.overallSummary.criticalIssuesCount > 0) {
      output += `  ${colors.red}Critical Issues: ${consolidated.overallSummary.criticalIssuesCount}${colors.reset}\n`;
    }

    if (consolidated.overallSummary.performanceIssuesCount > 0) {
      output += `  ${colors.yellow}Performance Issues: ${consolidated.overallSummary.performanceIssuesCount}${colors.reset}\n`;
    }

    output += `\n`;

    // Plugin Results
    output += `${colors.bold}Plugin Results:${colors.reset}\n`;
    consolidated.pluginReports.forEach(report => {
      const statusColor = {
        passed: colors.green,
        warning: colors.yellow,
        failed: colors.red,
      }[report.summary.overallStatus];

      const passRate = ((report.passedTests / report.totalTests) * 100).toFixed(1);
      output += `  ${statusColor}${report.pluginName}${colors.reset} v${report.pluginVersion} - ${passRate}% (${report.passedTests}/${report.totalTests})\n`;
    });
    output += `\n`;

    // Performance Analysis
    if (options.includePerformanceMetrics) {
      output += `${colors.bold}Performance Analysis:${colors.reset}\n`;
      output += `  Slowest Tests:\n`;
      consolidated.performanceAnalysis.slowestTests.slice(0, 3).forEach(test => {
        output += `    ${test.pluginId}: ${test.testName} (${test.duration.toFixed(2)}ms)\n`;
      });
      output += `\n`;
    }

    // Recommendations
    if (options.includeRecommendations && consolidated.recommendations.length > 0) {
      output += `${colors.bold}Recommendations:${colors.reset}\n`;
      consolidated.recommendations.forEach(rec => {
        output += `  • ${rec}\n`;
      });
      output += `\n`;
    }

    return output;
  }

  private generateConsolidatedHtmlReport(
    consolidated: ConsolidatedReport,
    options: ReportOptions
  ): string {
    const theme = options.theme || 'light';
    const styles = this.getHtmlStyles(theme);

    const pluginTable = consolidated.pluginReports
      .map(report => {
        const statusClass = report.summary.overallStatus;
        const statusIcon = {
          passed: '✅',
          warning: '⚠️',
          failed: '❌',
        }[statusClass];
        const passRate = ((report.passedTests / report.totalTests) * 100).toFixed(1);

        return `
<tr class="plugin-row ${statusClass}">
    <td>${statusIcon}</td>
    <td>${report.pluginName}</td>
    <td>${report.pluginVersion}</td>
    <td>${report.totalTests}</td>
    <td>${report.passedTests}</td>
    <td>${report.failedTests}</td>
    <td>${passRate}%</td>
    <td>${this.formatDuration(report.totalDuration)}</td>
</tr>`;
      })
      .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consolidated Plugin Test Report</title>
    <style>${styles}</style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>Consolidated Plugin Test Report</h1>
            <p>Generated: ${consolidated.overallSummary.executionDate.toLocaleString()}</p>
            <p>Total Duration: ${this.formatDuration(consolidated.overallSummary.totalDuration)}</p>
        </header>

        <section class="summary">
            <h2>Overall Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-number">${consolidated.overallSummary.totalPlugins}</div>
                    <div class="summary-label">Plugins</div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${consolidated.overallSummary.totalTests}</div>
                    <div class="summary-label">Total Tests</div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${consolidated.overallSummary.overallPassRate.toFixed(1)}%</div>
                    <div class="summary-label">Pass Rate</div>
                </div>
                <div class="summary-card">
                    <div class="summary-number">${consolidated.overallSummary.criticalIssuesCount}</div>
                    <div class="summary-label">Critical Issues</div>
                </div>
            </div>
        </section>

        <section class="plugin-results">
            <h2>Plugin Results</h2>
            <table class="test-table">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th>Plugin</th>
                        <th>Version</th>
                        <th>Tests</th>
                        <th>Passed</th>
                        <th>Failed</th>
                        <th>Pass Rate</th>
                        <th>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    ${pluginTable}
                </tbody>
            </table>
        </section>

        ${
          options.includeRecommendations && consolidated.recommendations.length > 0
            ? `
        <section class="recommendations">
            <h2>Recommendations</h2>
            <ul class="recommendation-list">
                ${consolidated.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </section>`
            : ''
        }
    </div>
</body>
</html>`;
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  private formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds.toFixed(0)}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  private getHtmlStyles(theme: 'light' | 'dark' | 'telegram'): string {
    const themes = {
      light: {
        bg: '#ffffff',
        text: '#333333',
        border: '#e0e0e0',
        primary: '#007AFF',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        secondary: '#f8f9fa',
      },
      dark: {
        bg: '#1a1a1a',
        text: '#ffffff',
        border: '#333333',
        primary: '#007AFF',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        secondary: '#2d2d2d',
      },
      telegram: {
        bg: 'var(--tg-theme-bg-color, #ffffff)',
        text: 'var(--tg-theme-text-color, #333333)',
        border: 'var(--tg-theme-secondary-bg-color, #e0e0e0)',
        primary: 'var(--tg-theme-button-color, #007AFF)',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        secondary: 'var(--tg-theme-secondary-bg-color, #f8f9fa)',
      },
    };

    const colors = themes[theme];

    return `
        * { box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background: ${colors.bg};
            color: ${colors.text};
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
            padding: 2rem;
            background: ${colors.secondary};
            border-radius: 12px;
            border: 1px solid ${colors.border};
        }
        
        .header h1 {
            margin: 0 0 1rem 0;
            color: ${colors.primary};
            font-size: 2.5rem;
            font-weight: 700;
        }
        
        .plugin-info {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .plugin-info h2 {
            margin: 0;
            font-size: 1.5rem;
        }
        
        .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .status-badge.passed { background: ${colors.success}; color: white; }
        .status-badge.warning { background: ${colors.warning}; color: white; }
        .status-badge.failed { background: ${colors.danger}; color: white; }
        
        .execution-info {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 1rem;
        }
        
        .execution-info p {
            margin: 0;
            font-size: 0.9rem;
            color: ${colors.text};
            opacity: 0.8;
        }
        
        .summary {
            margin-bottom: 2rem;
        }
        
        .summary h3, .summary h2 {
            margin-bottom: 1.5rem;
            color: ${colors.primary};
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .summary-card {
            text-align: center;
            padding: 1.5rem;
            background: ${colors.secondary};
            border-radius: 12px;
            border: 1px solid ${colors.border};
        }
        
        .summary-number {
            font-size: 2rem;
            font-weight: 700;
            color: ${colors.primary};
        }
        
        .summary-card.passed .summary-number { color: ${colors.success}; }
        .summary-card.failed .summary-number { color: ${colors.danger}; }
        
        .summary-label {
            font-size: 0.9rem;
            color: ${colors.text};
            opacity: 0.8;
            margin-top: 0.5rem;
        }
        
        .alert {
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
        }
        
        .alert.critical {
            background: rgba(220, 53, 69, 0.1);
            border: 1px solid ${colors.danger};
            color: ${colors.danger};
        }
        
        .alert.warning {
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid ${colors.warning};
            color: #856404;
        }
        
        .alert.success {
            background: rgba(40, 167, 69, 0.1);
            border: 1px solid ${colors.success};
            color: ${colors.success};
        }
        
        .test-details, .plugin-results {
            margin-bottom: 2rem;
        }
        
        .test-details h3, .plugin-results h2 {
            margin-bottom: 1rem;
            color: ${colors.primary};
        }
        
        .test-table {
            width: 100%;
            border-collapse: collapse;
            background: ${colors.secondary};
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid ${colors.border};
        }
        
        .test-table th {
            background: ${colors.primary};
            color: white;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
        }
        
        .test-table td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid ${colors.border};
        }
        
        .test-row.passed {
            background: rgba(40, 167, 69, 0.05);
        }
        
        .test-row.failed {
            background: rgba(220, 53, 69, 0.05);
        }
        
        .plugin-row.passed {
            background: rgba(40, 167, 69, 0.05);
        }
        
        .plugin-row.warning {
            background: rgba(255, 193, 7, 0.05);
        }
        
        .plugin-row.failed {
            background: rgba(220, 53, 69, 0.05);
        }
        
        .test-message {
            max-width: 300px;
            word-wrap: break-word;
            font-size: 0.9rem;
        }
        
        .performance-metrics {
            margin-bottom: 2rem;
        }
        
        .performance-metrics h3 {
            margin-bottom: 1rem;
            color: ${colors.primary};
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .metric-card {
            padding: 1.5rem;
            background: ${colors.secondary};
            border-radius: 8px;
            border: 1px solid ${colors.border};
            text-align: center;
        }
        
        .metric-card h4 {
            margin: 0 0 1rem 0;
            color: ${colors.text};
            font-size: 1rem;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: ${colors.primary};
        }
        
        .chart-container {
            margin: 2rem 0;
            text-align: center;
        }
        
        .recommendations {
            margin-bottom: 2rem;
        }
        
        .recommendations h3, .recommendations h2 {
            margin-bottom: 1rem;
            color: ${colors.primary};
        }
        
        .recommendation-list {
            list-style: none;
            padding: 0;
        }
        
        .recommendation-list li {
            padding: 0.75rem 1rem;
            margin: 0.5rem 0;
            background: ${colors.secondary};
            border-radius: 8px;
            border-left: 4px solid ${colors.warning};
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .execution-info {
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .plugin-info {
                flex-direction: column;
            }
            
            .summary-grid {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
            
            .test-table {
                font-size: 0.9rem;
            }
            
            .test-table th,
            .test-table td {
                padding: 0.5rem;
            }
        }
    `;
  }
}

// Export for easy use
export const testReportGenerator = new TestReportGenerator();
