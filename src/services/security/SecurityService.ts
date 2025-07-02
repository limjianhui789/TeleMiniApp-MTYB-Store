// Browser-compatible crypto implementation
import bcrypt from 'bcryptjs';

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
  hashing: {
    saltRounds: number;
    algorithm: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  session: {
    secret: string;
    maxAge: number;
  };
}

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag?: string;
}

export interface SecurityAudit {
  timestamp: Date;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  source: string;
  userId?: string;
}

export class SecurityService {
  private readonly config: SecurityConfig;
  private encryptionKey?: CryptoKey;
  private securityAudits: SecurityAudit[] = [];
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.config = {
      encryption: {
        algorithm: 'AES-GCM',
        keyLength: 256,
        ivLength: 12
      },
      hashing: {
        saltRounds: 12,
        algorithm: 'bcrypt'
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
      },
      session: {
        secret: this.generateRandomString(64),
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    };

    this.initializeEncryption();
  }

  private async initializeEncryption(): Promise<void> {
    try {
      // Generate or import encryption key
      this.encryptionKey = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: this.config.encryption.keyLength,
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.warn('Failed to initialize Web Crypto API:', error);
    }
  }

  // Browser-compatible random generation
  private generateRandomBytes(length: number): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }

  private generateRandomString(length: number): string {
    const bytes = this.generateRandomBytes(Math.ceil(length / 2));
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, length);
  }

  // Encryption and Decryption using Web Crypto API
  async encrypt(data: string): Promise<EncryptionResult> {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryption();
      }

      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const iv = this.generateRandomBytes(this.config.encryption.ivLength);

      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey,
        dataBuffer
      );

      return {
        encrypted: this.bufferToHex(encryptedBuffer),
        iv: this.bufferToHex(iv)
      };
    } catch (error) {
      this.auditSecurityEvent('encryption_failed', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Encryption failed');
    }
  }

  async decrypt(encryptedData: EncryptionResult): Promise<string> {
    try {
      if (!this.encryptionKey) {
        await this.initializeEncryption();
      }

      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      const encryptedBuffer = this.hexToBuffer(encryptedData.encrypted);
      const iv = this.hexToBuffer(encryptedData.iv);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.encryptionKey,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      this.auditSecurityEvent('decryption_failed', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Decryption failed');
    }
  }

  // Utility functions for hex conversion
  private bufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private hexToBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes.buffer;
  }

  // Password Hashing
  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.config.hashing.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      this.auditSecurityEvent('password_hashing_failed', 'high', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Password hashing failed');
    }
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      this.auditSecurityEvent('password_verification_failed', 'medium', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  // Secure random generation
  generateSecureToken(length: number = 32): string {
    return this.generateRandomString(length * 2);
  }

  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const randomBytes = this.generateRandomBytes(length);
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }
    
    return password;
  }

  // Input validation and sanitization
  sanitizeInput(input: string): string {
    if (!input) return '';
    return input
      .replace(/[<>]/g, '') // Remove potential XSS chars
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and easily guessable');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Rate limiting
  checkRateLimit(identifier: string, limit?: number, windowMs?: number): boolean {
    const maxRequests = limit || this.config.rateLimit.maxRequests;
    const window = windowMs || this.config.rateLimit.windowMs;
    const now = Date.now();
    
    const existing = this.rateLimitStore.get(identifier);
    
    if (!existing || now > existing.resetTime) {
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + window
      });
      return true;
    }
    
    if (existing.count >= maxRequests) {
      this.auditSecurityEvent('rate_limit_exceeded', 'medium', {
        identifier,
        attempts: existing.count,
        limit: maxRequests
      });
      return false;
    }
    
    existing.count++;
    return true;
  }

  // CSRF protection
  generateCSRFToken(): string {
    return this.generateRandomString(64);
  }

  validateCSRFToken(token: string, sessionToken: string): boolean {
    // In a real implementation, this would validate against stored session tokens
    return token.length === 64 && /^[a-f0-9]+$/.test(token);
  }

  // Content Security Policy
  generateCSPNonce(): string {
    const bytes = this.generateRandomBytes(16);
    return btoa(String.fromCharCode(...bytes));
  }

  getSecurityHeaders(nonce?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    };

    if (nonce) {
      headers['Content-Security-Policy'] = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');
    }

    return headers;
  }

  // Security scanning
  async scanForMaliciousCode(code: string): Promise<{ safe: boolean; threats: string[] }> {
    const threats: string[] = [];
    
    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/gi, threat: 'Dynamic code execution (eval)' },
      { pattern: /Function\s*\(/gi, threat: 'Dynamic function creation' },
      { pattern: /setTimeout\s*\(\s*["'`][^"'`]*["'`]/gi, threat: 'String-based setTimeout' },
      { pattern: /setInterval\s*\(\s*["'`][^"'`]*["'`]/gi, threat: 'String-based setInterval' },
      { pattern: /document\.write/gi, threat: 'DOM manipulation via document.write' },
      { pattern: /innerHTML\s*=/gi, threat: 'Potential XSS via innerHTML' },
      { pattern: /outerHTML\s*=/gi, threat: 'Potential XSS via outerHTML' },
      { pattern: /javascript:/gi, threat: 'JavaScript protocol usage' },
      { pattern: /data:.*javascript/gi, threat: 'Data URI with JavaScript' },
      { pattern: /vbscript:/gi, threat: 'VBScript protocol usage' },
      { pattern: /onload\s*=/gi, threat: 'Event handler injection' },
      { pattern: /onerror\s*=/gi, threat: 'Error handler injection' },
      { pattern: /onclick\s*=/gi, threat: 'Click handler injection' }
    ];

    for (const { pattern, threat } of dangerousPatterns) {
      if (pattern.test(code)) {
        threats.push(threat);
      }
    }

    // Check for suspicious keywords
    const suspiciousKeywords = [
      'document.cookie', 'localStorage', 'sessionStorage', 'XMLHttpRequest',
      'fetch', 'WebSocket', 'EventSource', 'SharedWorker', 'ServiceWorker'
    ];

    for (const keyword of suspiciousKeywords) {
      if (code.includes(keyword)) {
        threats.push(`Suspicious API usage: ${keyword}`);
      }
    }

    const safe = threats.length === 0;
    
    if (!safe) {
      this.auditSecurityEvent('malicious_code_detected', 'critical', {
        threats,
        codeLength: code.length
      });
    }

    return { safe, threats };
  }

  // File security
  validateFileUpload(file: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`);
    }

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check for malicious file names
    const maliciousPatterns = [
      /\.\./,  // Directory traversal
      /[<>:"|?*]/,  // Invalid characters
      /\.(exe|bat|cmd|scr|pif|com)$/i  // Executable extensions
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(file.originalname)) {
        errors.push('File name contains potentially dangerous characters');
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Security audit logging
  auditSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    userId?: string
  ): void {
    const audit: SecurityAudit = {
      timestamp: new Date(),
      event,
      severity,
      details,
      source: 'SecurityService',
      userId
    };

    this.securityAudits.push(audit);

    // Log critical events immediately
    if (severity === 'critical') {
      console.error('🚨 CRITICAL SECURITY EVENT:', audit);
    } else if (severity === 'high') {
      console.warn('⚠️ HIGH SEVERITY SECURITY EVENT:', audit);
    }

    // Limit audit log size
    if (this.securityAudits.length > 10000) {
      this.securityAudits = this.securityAudits.slice(-5000);
    }
  }

  getSecurityAudits(
    severity?: 'low' | 'medium' | 'high' | 'critical',
    limit: number = 100
  ): SecurityAudit[] {
    let audits = this.securityAudits;
    
    if (severity) {
      audits = audits.filter(audit => audit.severity === severity);
    }
    
    return audits
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // IP address validation and security
  validateIPAddress(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];

    return privateRanges.some(range => range.test(ip));
  }

  // Data anonymization
  anonymizeData(data: any, fields: string[]): any {
    const anonymized = { ...data };
    
    for (const field of fields) {
      if (anonymized[field]) {
        if (typeof anonymized[field] === 'string') {
          anonymized[field] = this.anonymizeString(anonymized[field]);
        } else {
          anonymized[field] = '[ANONYMIZED]';
        }
      }
    }
    
    return anonymized;
  }

  private anonymizeString(str: string): string {
    if (str.includes('@')) {
      // Email anonymization
      const parts = str.split('@');
      const local = parts[0];
      const domain = parts[1];
      if (local && domain) {
        return `${local.charAt(0)}***@${domain}`;
      }
    }
    
    if (str.length > 4) {
      // General string anonymization
      return `${str.substring(0, 2)}***${str.substring(str.length - 2)}`;
    } else {
      return '***';
    }
  }

  // Cleanup methods
  cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (now > value.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  async generateSecurityReport(): Promise<any> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentAudits = this.securityAudits.filter(audit => audit.timestamp > last24h);
    
    return {
      timestamp: now,
      auditSummary: {
        total: recentAudits.length,
        critical: recentAudits.filter(a => a.severity === 'critical').length,
        high: recentAudits.filter(a => a.severity === 'high').length,
        medium: recentAudits.filter(a => a.severity === 'medium').length,
        low: recentAudits.filter(a => a.severity === 'low').length
      },
      topEvents: this.getTopSecurityEvents(recentAudits),
      rateLimitStats: {
        activeKeys: this.rateLimitStore.size,
        recentBlocks: recentAudits.filter(a => a.event === 'rate_limit_exceeded').length
      },
      systemHealth: {
        encryptionWorking: await this.testEncryption(),
        hashingWorking: await this.testHashing()
      }
    };
  }

  private getTopSecurityEvents(audits: SecurityAudit[]): Array<{ event: string; count: number }> {
    const eventCounts = new Map<string, number>();
    
    for (const audit of audits) {
      eventCounts.set(audit.event, (eventCounts.get(audit.event) || 0) + 1);
    }
    
    return Array.from(eventCounts.entries())
      .map(([event, count]) => ({ event, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private async testEncryption(): Promise<boolean> {
    try {
      const testData = 'test-encryption-data';
      const encrypted = await this.encrypt(testData);
      const decrypted = await this.decrypt(encrypted);
      return decrypted === testData;
    } catch {
      return false;
    }
  }

  private async testHashing(): Promise<boolean> {
    try {
      const testPassword = 'test-password';
      const hashed = await this.hashPassword(testPassword);
      return await this.verifyPassword(testPassword, hashed);
    } catch {
      return false;
    }
  }
}

export const securityService = new SecurityService();