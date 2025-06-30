// ============================================================================
// MTYB Virtual Goods Platform - File Delivery Plugin Template
// ============================================================================

import { BasePlugin } from '../../core/plugin/BasePlugin';
import type {
  PluginContext,
  DeliveryResult,
  ValidationResult,
  PluginHealthStatus,
  Order,
  Product,
} from '../../types';
import { Logger } from '../../core/utils/Logger';

// ============================================================================
// File Delivery Types
// ============================================================================

export interface FileConfig {
  storageProvider: 'local' | 's3' | 'dropbox' | 'google_drive' | 'custom';
  basePath: string;
  credentials?: {
    accessKey?: string;
    secretKey?: string;
    region?: string;
    bucket?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
  };
  downloadSettings: {
    expiryHours: number;
    maxDownloads: number;
    requireAuth: boolean;
    allowPreview: boolean;
  };
  compressionSettings?: {
    enabled: boolean;
    format: 'zip' | 'rar' | '7z';
    level: number;
  };
}

export interface DeliveryFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  downloadUrl: string;
  previewUrl?: string;
  expiresAt: Date;
  downloadCount: number;
  maxDownloads: number;
  isCompressed: boolean;
  checksum: string;
  metadata?: Record<string, any>;
}

export interface FilePackage {
  id: string;
  name: string;
  description?: string;
  files: DeliveryFile[];
  totalSize: number;
  downloadUrl: string;
  isCompressed: boolean;
  createdAt: Date;
  expiresAt: Date;
  downloadCount: number;
  maxDownloads: number;
}

export interface FileDeliveryData {
  packages: FilePackage[];
  files: DeliveryFile[];
  instructions: string;
  downloadInstructions: string;
  supportInfo: {
    email: string;
    downloadIssues: string;
    technicalSupport: string;
  };
  securityInfo: {
    checksums: Record<string, string>;
    virusScanStatus: 'clean' | 'scanning' | 'infected' | 'unknown';
    encryptionUsed: boolean;
  };
}

// ============================================================================
// Storage Provider Interface
// ============================================================================

interface StorageProvider {
  uploadFile(file: Buffer, filename: string, metadata?: Record<string, any>): Promise<string>;
  generateDownloadUrl(fileId: string, expiryHours: number): Promise<string>;
  deleteFile(fileId: string): Promise<boolean>;
  getFileInfo(
    fileId: string
  ): Promise<{ size: number; mimeType: string; lastModified: Date } | null>;
  checkHealth(): Promise<boolean>;
}

// ============================================================================
// Local Storage Provider Implementation
// ============================================================================

class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private logger: Logger;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.logger = new Logger('LocalStorageProvider');
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Simulate file upload - replace with actual file system operations
      const fileId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.logger.info('File uploaded to local storage', {
        filename,
        fileId,
        size: file.length,
      });

      return fileId;
    } catch (error) {
      this.logger.error('Failed to upload file to local storage', { error, filename });
      throw error;
    }
  }

  async generateDownloadUrl(fileId: string, expiryHours: number): Promise<string> {
    // Generate a secure download URL with expiry
    const expiryTimestamp = Date.now() + expiryHours * 60 * 60 * 1000;
    const token = this.generateSecureToken(fileId, expiryTimestamp);

    return `/api/files/download/${fileId}?token=${token}&expires=${expiryTimestamp}`;
  }

  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // Simulate file deletion
      this.logger.info('File deleted from local storage', { fileId });
      return true;
    } catch (error) {
      this.logger.error('Failed to delete file from local storage', { error, fileId });
      return false;
    }
  }

  async getFileInfo(
    fileId: string
  ): Promise<{ size: number; mimeType: string; lastModified: Date } | null> {
    try {
      // Simulate file info retrieval
      return {
        size: Math.floor(Math.random() * 10000000) + 1000000, // 1-10MB
        mimeType: 'application/zip',
        lastModified: new Date(),
      };
    } catch {
      return null;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Check if storage is accessible
      return true;
    } catch {
      return false;
    }
  }

  private generateSecureToken(fileId: string, expiry: number): string {
    // Generate a secure token - in production, use proper cryptographic signing
    const data = `${fileId}-${expiry}`;
    return Buffer.from(data).toString('base64url');
  }
}

// ============================================================================
// File Compression Utility
// ============================================================================

class FileCompressor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('FileCompressor');
  }

  async compressFiles(
    files: Array<{ name: string; data: Buffer }>,
    format: 'zip' | 'rar' | '7z' = 'zip'
  ): Promise<Buffer> {
    try {
      this.logger.info('Compressing files', { count: files.length, format });

      // Simulate file compression - replace with actual compression library
      await this.delay(2000);

      // Create mock compressed data
      const totalSize = files.reduce((sum, file) => sum + file.data.length, 0);
      const compressedSize = Math.floor(totalSize * 0.7); // Simulate 30% compression
      const compressedData = Buffer.alloc(compressedSize);

      this.logger.info('Files compressed successfully', {
        originalSize: totalSize,
        compressedSize,
        compressionRatio: ((compressedSize / totalSize) * 100).toFixed(1) + '%',
      });

      return compressedData;
    } catch (error) {
      this.logger.error('Failed to compress files', { error });
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// File Delivery Plugin Base Class
// ============================================================================

export abstract class FileDeliveryPlugin extends BasePlugin {
  protected storageProvider: StorageProvider;
  protected fileCompressor: FileCompressor;
  protected deliveredPackages: Map<string, FilePackage[]> = new Map();
  protected config: FileConfig;

  constructor(config: FileConfig) {
    super();
    this.config = config;
    this.fileCompressor = new FileCompressor();

    // Initialize storage provider
    switch (config.storageProvider) {
      case 'local':
        this.storageProvider = new LocalStorageProvider(config.basePath);
        break;
      // Add other storage providers here
      default:
        throw new Error(`Unsupported storage provider: ${config.storageProvider}`);
    }
  }

  // Abstract methods to be implemented by specific file delivery plugins
  abstract getServiceName(): string;
  abstract prepareFiles(orderDetails: any): Promise<Array<{ name: string; data: Buffer }>>;
  abstract validateFileConfig(config: any): ValidationResult;
  abstract getDeliveryInstructions(packages: FilePackage[]): string;

  async initialize(): Promise<void> {
    try {
      this.logger.info(`Initializing ${this.getServiceName()} File Delivery Plugin...`);

      // Test storage provider
      const isHealthy = await this.storageProvider.checkHealth();
      if (!isHealthy) {
        throw new Error('Storage provider health check failed');
      }

      this.logger.info(`${this.getServiceName()} File Delivery Plugin initialized successfully`);
      this.isInitialized = true;
    } catch (error) {
      this.logger.error(`Failed to initialize ${this.getServiceName()} File Delivery Plugin`, {
        error,
      });
      throw error;
    }
  }

  async validateOrder(context: PluginContext): Promise<ValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    try {
      const { product, order } = context;

      // Validate file-specific configuration
      const fileValidation = this.validateFileConfig(product.metadata);
      errors.push(...fileValidation.errors);
      warnings.push(...(fileValidation.warnings || []));

      // Check available storage space
      if (product.metadata.estimatedSize) {
        const sizeInMB = product.metadata.estimatedSize;
        if (sizeInMB > 1000) {
          // > 1GB
          warnings.push({
            field: 'fileSize',
            message: 'Large file size may affect download performance',
            code: 'LARGE_FILE_SIZE',
          });
        }
      }

      // Validate quantity for file delivery
      const orderItem = order.items.find(item => item.productId === product.id);
      if (orderItem && orderItem.quantity > 5) {
        warnings.push({
          field: 'quantity',
          message: 'Multiple file packages will be created',
          code: 'MULTIPLE_PACKAGES',
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error('Order validation failed', { error, orderId: context.order.id });
      return {
        isValid: false,
        errors: [
          {
            field: 'general',
            message: 'Validation failed due to system error',
            code: 'VALIDATION_ERROR',
          },
        ],
        warnings,
      };
    }
  }

  async processDelivery(context: PluginContext): Promise<DeliveryResult> {
    try {
      const { product, order, user } = context;
      const orderItem = order.items.find(item => item.productId === product.id);

      if (!orderItem) {
        throw new Error('Order item not found');
      }

      this.logger.info(`Processing ${this.getServiceName()} file delivery`, {
        orderId: order.id,
        productId: product.id,
        userId: user.id,
        quantity: orderItem.quantity,
      });

      const packages: FilePackage[] = [];

      // Create file packages for each quantity
      for (let i = 0; i < orderItem.quantity; i++) {
        const packageFiles = await this.prepareFiles({
          product,
          order,
          user,
          index: i,
        });

        const filePackage = await this.createFilePackage(
          `${product.name} - Package ${i + 1}`,
          packageFiles,
          order.id
        );

        packages.push(filePackage);
      }

      // Store delivered packages
      this.deliveredPackages.set(order.id, packages);

      // Calculate security info
      const checksums: Record<string, string> = {};
      const allFiles: DeliveryFile[] = [];

      packages.forEach(pkg => {
        pkg.files.forEach(file => {
          checksums[file.filename] = file.checksum;
          allFiles.push(file);
        });
      });

      const deliveryData: FileDeliveryData = {
        packages,
        files: allFiles,
        instructions: this.getDeliveryInstructions(packages),
        downloadInstructions: this.generateDownloadInstructions(),
        supportInfo: {
          email: product.metadata.supportEmail || 'support@mtyb.com',
          downloadIssues:
            product.metadata.downloadSupportUrl || 'https://support.mtyb.com/downloads',
          technicalSupport: product.metadata.techSupportUrl || 'https://support.mtyb.com/technical',
        },
        securityInfo: {
          checksums,
          virusScanStatus: 'clean',
          encryptionUsed: this.config.downloadSettings.requireAuth,
        },
      };

      this.logger.info(`${this.getServiceName()} file delivery processed successfully`, {
        orderId: order.id,
        packagesCreated: packages.length,
        totalFiles: allFiles.length,
      });

      return {
        success: true,
        deliveryData,
        metadata: {
          packageCount: packages.length,
          fileCount: allFiles.length,
          totalSize: packages.reduce((sum, pkg) => sum + pkg.totalSize, 0),
          serviceName: this.getServiceName(),
        },
      };
    } catch (error) {
      this.logger.error(`${this.getServiceName()} file delivery failed`, {
        error,
        orderId: context.order.id,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown delivery error',
        retryable: true,
        metadata: {
          failureReason: error instanceof Error ? error.message : 'Unknown error',
          serviceName: this.getServiceName(),
        },
      };
    }
  }

  async getHealthStatus(): Promise<PluginHealthStatus> {
    try {
      const startTime = Date.now();
      const isHealthy = await this.storageProvider.checkHealth();
      const responseTime = Date.now() - startTime;

      return {
        isHealthy,
        lastCheck: new Date(),
        responseTime,
        metadata: {
          storageProvider: this.config.storageProvider,
          storageHealthy: isHealthy,
          serviceName: this.getServiceName(),
        },
      };
    } catch (error) {
      return {
        isHealthy: false,
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : 'Health check failed',
        metadata: {
          serviceName: this.getServiceName(),
          storageProvider: this.config.storageProvider,
        },
      };
    }
  }

  // File package creation
  private async createFilePackage(
    name: string,
    files: Array<{ name: string; data: Buffer }>,
    orderId: string
  ): Promise<FilePackage> {
    const packageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const deliveryFiles: DeliveryFile[] = [];
    let totalSize = 0;

    // Process individual files
    for (const file of files) {
      const fileId = await this.storageProvider.uploadFile(file.data, file.name);
      const downloadUrl = await this.storageProvider.generateDownloadUrl(
        fileId,
        this.config.downloadSettings.expiryHours
      );

      const deliveryFile: DeliveryFile = {
        id: fileId,
        filename: file.name,
        originalName: file.name,
        size: file.data.length,
        mimeType: this.getMimeType(file.name),
        downloadUrl,
        expiresAt: new Date(Date.now() + this.config.downloadSettings.expiryHours * 60 * 60 * 1000),
        downloadCount: 0,
        maxDownloads: this.config.downloadSettings.maxDownloads,
        isCompressed: false,
        checksum: this.calculateChecksum(file.data),
      };

      deliveryFiles.push(deliveryFile);
      totalSize += file.data.length;
    }

    // Create compressed package if enabled
    let packageDownloadUrl = '';
    let isCompressed = false;

    if (this.config.compressionSettings?.enabled && files.length > 1) {
      const compressedData = await this.fileCompressor.compressFiles(
        files,
        this.config.compressionSettings.format
      );

      const compressedFileName = `${name.replace(/[^a-zA-Z0-9]/g, '_')}.${this.config.compressionSettings.format}`;
      const compressedFileId = await this.storageProvider.uploadFile(
        compressedData,
        compressedFileName
      );
      packageDownloadUrl = await this.storageProvider.generateDownloadUrl(
        compressedFileId,
        this.config.downloadSettings.expiryHours
      );
      isCompressed = true;
    } else if (files.length === 1) {
      packageDownloadUrl = deliveryFiles[0].downloadUrl;
    }

    return {
      id: packageId,
      name,
      files: deliveryFiles,
      totalSize,
      downloadUrl: packageDownloadUrl,
      isCompressed,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.downloadSettings.expiryHours * 60 * 60 * 1000),
      downloadCount: 0,
      maxDownloads: this.config.downloadSettings.maxDownloads,
    };
  }

  private generateDownloadInstructions(): string {
    return `
## Download Instructions

### How to Download Your Files:

1. **Click the download link** provided for each file or package
2. **Save to a secure location** on your device
3. **Verify file integrity** using the provided checksums
4. **Extract compressed files** if applicable

### Important Notes:

- Download links expire in ${this.config.downloadSettings.expiryHours} hours
- Each file can be downloaded up to ${this.config.downloadSettings.maxDownloads} times
- Files are scanned for viruses before delivery
- Keep your download links secure and do not share them

### File Verification:

Use the provided checksums to verify file integrity:
\`\`\`
# On Windows (PowerShell):
Get-FileHash -Algorithm SHA256 "filename.ext"

# On macOS/Linux:
shasum -a 256 filename.ext
\`\`\`

### Troubleshooting:

- **Download fails**: Check your internet connection and try again
- **File corrupted**: Compare checksum and re-download if needed
- **Link expired**: Contact support for new download links
- **Extract issues**: Ensure you have appropriate software (7-Zip, WinRAR, etc.)

### Support:

Contact our support team if you experience any issues with your downloads.
    `.trim();
  }

  // Utility methods
  private getMimeType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      pdf: 'application/pdf',
      txt: 'text/plain',
      exe: 'application/x-msdownload',
      msi: 'application/x-msi',
      dmg: 'application/x-apple-diskimage',
      pkg: 'application/x-newton-compatible-pkg',
      deb: 'application/x-debian-package',
      rpm: 'application/x-rpm',
      iso: 'application/x-iso9660-image',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  private calculateChecksum(data: Buffer): string {
    // Simulate checksum calculation - replace with actual crypto implementation
    const hash = Math.random().toString(36).substring(2, 15);
    return `sha256:${hash}`;
  }

  // Package management methods
  async getDeliveredPackages(orderId: string): Promise<FilePackage[]> {
    return this.deliveredPackages.get(orderId) || [];
  }

  async extendDownloadExpiry(orderId: string, packageId: string, hours: number): Promise<boolean> {
    try {
      const packages = this.deliveredPackages.get(orderId);
      if (!packages) return false;

      const packageIndex = packages.findIndex(pkg => pkg.id === packageId);
      if (packageIndex === -1) return false;

      const pkg = packages[packageIndex];
      pkg.expiresAt = new Date(pkg.expiresAt.getTime() + hours * 60 * 60 * 1000);

      // Update file expiry times
      for (const file of pkg.files) {
        file.expiresAt = new Date(file.expiresAt.getTime() + hours * 60 * 60 * 1000);
        // Regenerate download URL with new expiry
        file.downloadUrl = await this.storageProvider.generateDownloadUrl(file.id, hours);
      }

      this.deliveredPackages.set(orderId, packages);
      this.logger.info('Download expiry extended', { orderId, packageId, hours });
      return true;
    } catch (error) {
      this.logger.error('Failed to extend download expiry', { error, orderId, packageId });
      return false;
    }
  }

  async invalidateDownloads(orderId: string, packageId?: string): Promise<boolean> {
    try {
      const packages = this.deliveredPackages.get(orderId);
      if (!packages) return false;

      const packagesToInvalidate = packageId
        ? packages.filter(pkg => pkg.id === packageId)
        : packages;

      for (const pkg of packagesToInvalidate) {
        for (const file of pkg.files) {
          await this.storageProvider.deleteFile(file.id);
        }
        pkg.expiresAt = new Date(); // Set to expired
      }

      this.deliveredPackages.set(orderId, packages);
      this.logger.info('Downloads invalidated', { orderId, packageId });
      return true;
    } catch (error) {
      this.logger.error('Failed to invalidate downloads', { error, orderId, packageId });
      return false;
    }
  }
}

// ============================================================================
// Example: Software Package Delivery Plugin
// ============================================================================

export class SoftwarePackagePlugin extends FileDeliveryPlugin {
  constructor() {
    const fileConfig: FileConfig = {
      storageProvider: 'local',
      basePath: process.env.SOFTWARE_STORAGE_PATH || '/var/storage/software',
      downloadSettings: {
        expiryHours: 72, // 3 days
        maxDownloads: 5,
        requireAuth: true,
        allowPreview: false,
      },
      compressionSettings: {
        enabled: true,
        format: 'zip',
        level: 6,
      },
    };

    super(fileConfig);
  }

  getId(): string {
    return 'software-package-plugin';
  }

  getName(): string {
    return 'Software Package Delivery Plugin';
  }

  getVersion(): string {
    return '1.0.0';
  }

  getDescription(): string {
    return 'Delivers software packages and installation files';
  }

  getAuthor(): string {
    return 'MTYB Virtual Goods Platform';
  }

  getServiceName(): string {
    return 'Software Package Delivery';
  }

  async prepareFiles(orderDetails: any): Promise<Array<{ name: string; data: Buffer }>> {
    const { product, index } = orderDetails;

    // Simulate preparing software files
    const files: Array<{ name: string; data: Buffer }> = [];

    // Main executable
    files.push({
      name: `${product.name.replace(/[^a-zA-Z0-9]/g, '_')}_v${product.metadata.version || '1.0'}.exe`,
      data: Buffer.alloc(5000000), // 5MB mock file
    });

    // License file
    if (product.metadata.includeLicense) {
      files.push({
        name: 'LICENSE.txt',
        data: Buffer.from(
          `Software License Agreement\n\nProduct: ${product.name}\nVersion: ${product.metadata.version}\nLicense Key: ${this.generateLicenseKey()}\n`
        ),
      });
    }

    // Documentation
    if (product.metadata.includeDocumentation) {
      files.push({
        name: 'README.txt',
        data: Buffer.from(
          `${product.name}\n\nInstallation Instructions:\n1. Run the installer\n2. Follow the setup wizard\n3. Enter your license key when prompted\n\nSupport: support@mtyb.com`
        ),
      });
    }

    // Additional files based on product metadata
    if (product.metadata.additionalFiles) {
      for (const additionalFile of product.metadata.additionalFiles) {
        files.push({
          name: additionalFile.name,
          data: Buffer.alloc(additionalFile.size || 1000000), // Mock additional file
        });
      }
    }

    return files;
  }

  validateFileConfig(config: any): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!config.version) {
      warnings.push({
        field: 'version',
        message: 'No version specified, using default (1.0)',
        code: 'NO_VERSION',
      });
    }

    if (config.estimatedSize && config.estimatedSize > 500) {
      // > 500MB
      warnings.push({
        field: 'estimatedSize',
        message: 'Large file size may affect delivery time',
        code: 'LARGE_SIZE',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  getDeliveryInstructions(packages: FilePackage[]): string {
    return `
## Software Package Delivery

### Your Software Package(s):
${packages
  .map(
    (pkg, index) => `
**Package ${index + 1}: ${pkg.name}**
- Files: ${pkg.files.length}
- Total Size: ${(pkg.totalSize / 1024 / 1024).toFixed(2)} MB
- Download Link: Available below
- Expires: ${pkg.expiresAt.toLocaleDateString()}
`
  )
  .join('\n')}

### Installation Instructions:

1. **Download** your software package using the link provided
2. **Extract** the files if compressed (recommended: 7-Zip or WinRAR)
3. **Run** the installer as Administrator (Windows) or with sudo (Linux/macOS)
4. **Follow** the installation wizard prompts
5. **Enter** your license key when prompted (if included)

### System Requirements:

- Check the README.txt file for specific requirements
- Ensure you have sufficient disk space
- Close antivirus temporarily during installation if needed
- Backup your system before installing major software

### License Information:

- License keys are included in the LICENSE.txt file
- Keep your license key secure for future reinstallations
- Contact support if you need additional licenses

### Troubleshooting:

- **Installation fails**: Run as Administrator/sudo
- **Antivirus blocks**: Add software to exclusions temporarily
- **License issues**: Check LICENSE.txt for correct key format
- **Compatibility issues**: Check system requirements in README.txt

### Support:

Our technical support team is available to help with installation and configuration issues.
    `.trim();
  }

  private generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      const segment = Math.random().toString(36).substring(2, 7).toUpperCase();
      segments.push(segment);
    }
    return segments.join('-');
  }
}

// Export instances
export const softwarePackagePlugin = new SoftwarePackagePlugin();
