// Browser-compatible validation utilities
// Replaces express-validator with client-side validation

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class Validator {
  private errors: ValidationError[] = [];

  constructor(private data: Record<string, any>) {}

  /**
   * Check if field is required and not empty
   */
  required(field: string, message?: string): this {
    const value = this.data[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      this.errors.push({
        field,
        message: message || `${field} is required`,
        value,
      });
    }
    return this;
  }

  /**
   * Check email format
   */
  email(field: string, message?: string): this {
    const value = this.data[field];
    if (value && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.errors.push({
          field,
          message: message || 'Invalid email format',
          value,
        });
      }
    }
    return this;
  }

  /**
   * Check minimum length
   */
  minLength(field: string, min: number, message?: string): this {
    const value = this.data[field];
    if (value && typeof value === 'string' && value.length < min) {
      this.errors.push({
        field,
        message: message || `${field} must be at least ${min} characters`,
        value,
      });
    }
    return this;
  }

  /**
   * Check maximum length
   */
  maxLength(field: string, max: number, message?: string): this {
    const value = this.data[field];
    if (value && typeof value === 'string' && value.length > max) {
      this.errors.push({
        field,
        message: message || `${field} must not exceed ${max} characters`,
        value,
      });
    }
    return this;
  }

  /**
   * Check if value is numeric
   */
  numeric(field: string, message?: string): this {
    const value = this.data[field];
    if (value && isNaN(Number(value))) {
      this.errors.push({
        field,
        message: message || `${field} must be a number`,
        value,
      });
    }
    return this;
  }

  /**
   * Check if number is within range
   */
  range(field: string, min: number, max: number, message?: string): this {
    const value = Number(this.data[field]);
    if (!isNaN(value) && (value < min || value > max)) {
      this.errors.push({
        field,
        message: message || `${field} must be between ${min} and ${max}`,
        value,
      });
    }
    return this;
  }

  /**
   * Check if value matches pattern
   */
  pattern(field: string, regex: RegExp, message?: string): this {
    const value = this.data[field];
    if (value && typeof value === 'string' && !regex.test(value)) {
      this.errors.push({
        field,
        message: message || `${field} format is invalid`,
        value,
      });
    }
    return this;
  }

  /**
   * Check if value is in allowed list
   */
  isIn(field: string, allowedValues: any[], message?: string): this {
    const value = this.data[field];
    if (value && !allowedValues.includes(value)) {
      this.errors.push({
        field,
        message: message || `${field} must be one of: ${allowedValues.join(', ')}`,
        value,
      });
    }
    return this;
  }

  /**
   * Check if value is UUID
   */
  uuid(field: string, message?: string): this {
    const value = this.data[field];
    if (value && typeof value === 'string') {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        this.errors.push({
          field,
          message: message || 'Invalid UUID format',
          value,
        });
      }
    }
    return this;
  }

  /**
   * Check if value is ISO date
   */
  isoDate(field: string, message?: string): this {
    const value = this.data[field];
    if (value && typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime()) || date.toISOString() !== value) {
        this.errors.push({
          field,
          message: message || 'Invalid ISO date format',
          value,
        });
      }
    }
    return this;
  }

  /**
   * Custom validation function
   */
  custom(field: string, validator: (value: any) => boolean | string): this {
    const value = this.data[field];
    const result = validator(value);

    if (typeof result === 'string') {
      this.errors.push({
        field,
        message: result,
        value,
      });
    } else if (!result) {
      this.errors.push({
        field,
        message: `${field} is invalid`,
        value,
      });
    }
    return this;
  }

  /**
   * Get validation result
   */
  getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  /**
   * Reset validation errors
   */
  reset(): this {
    this.errors = [];
    return this;
  }
}

// Convenience functions for common validations
export const ValidationRules = {
  /**
   * Strong password validation
   */
  strongPassword: (value: string): boolean | string => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[a-z]/.test(value)) return 'Password must contain lowercase letter';
    if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
    if (!/\d/.test(value)) return 'Password must contain number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must contain special character';
    return true;
  },

  /**
   * Credit card number validation (basic Luhn algorithm)
   */
  creditCard: (value: string): boolean | string => {
    if (!value) return 'Credit card number is required';

    const cleaned = value.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) return 'Invalid credit card format';

    // Luhn algorithm
    let sum = 0;
    let alternate = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let n = parseInt(cleaned.charAt(i), 10);

      if (alternate) {
        n *= 2;
        if (n > 9) n = (n % 10) + 1;
      }

      sum += n;
      alternate = !alternate;
    }

    return sum % 10 === 0 || 'Invalid credit card number';
  },

  /**
   * Phone number validation
   */
  phoneNumber: (value: string): boolean | string => {
    if (!value) return 'Phone number is required';
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(value) || 'Invalid phone number format';
  },

  /**
   * URL validation
   */
  url: (value: string): boolean | string => {
    if (!value) return 'URL is required';
    try {
      new URL(value);
      return true;
    } catch {
      return 'Invalid URL format';
    }
  },
};

// Helper function to validate objects
export function validate(data: Record<string, any>): Validator {
  return new Validator(data);
}

// Helper function for quick validation
export function quickValidate(
  data: Record<string, any>,
  rules: Record<string, (validator: Validator) => Validator>
): ValidationResult {
  const validator = new Validator(data);

  Object.entries(rules).forEach(([field, rule]) => {
    rule(validator);
  });

  return validator.getResult();
}

// Export types for backward compatibility
export type ValidationChain = Validator;
export const body = () => validate;
export const param = () => validate;
export const query = () => validate;
