// ============================================================================
// MTYB Virtual Goods Platform - Validation Utility
// ============================================================================

import { type ValidationResult, type ValidationError, type ValidationWarning } from '../../types';
import { VALIDATION_RULES, ERROR_CODES } from '../constants';

export interface ValidationRule<T = any> {
  field: string;
  validator: (value: T, data?: any) => boolean | string;
  message?: string;
  required?: boolean;
}

export interface ValidationSchema {
  rules: ValidationRule[];
  allowUnknownFields?: boolean;
}

export class Validator {
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields and validate each rule
    for (const rule of schema.rules) {
      const value = this.getNestedValue(data, rule.field);
      const hasValue = value !== undefined && value !== null && value !== '';

      // Check if required field is missing
      if (rule.required && !hasValue) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} is required`,
          code: ERROR_CODES.VALIDATION_ERROR,
        });
        continue;
      }

      // Skip validation if field is not required and has no value
      if (!rule.required && !hasValue) {
        continue;
      }

      // Run validator
      const result = rule.validator(value, data);
      if (result !== true) {
        errors.push({
          field: rule.field,
          message: typeof result === 'string' ? result : rule.message || `${rule.field} is invalid`,
          code: ERROR_CODES.VALIDATION_ERROR,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Common validators
  static validators = {
    required: (value: any) => value !== undefined && value !== null && value !== '',

    string: (value: any) => typeof value === 'string',

    number: (value: any) => typeof value === 'number' && !isNaN(value),

    boolean: (value: any) => typeof value === 'boolean',

    email: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },

    url: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },

    minLength: (min: number) => (value: string) => typeof value === 'string' && value.length >= min,

    maxLength: (max: number) => (value: string) => typeof value === 'string' && value.length <= max,

    min: (min: number) => (value: number) => typeof value === 'number' && value >= min,

    max: (max: number) => (value: number) => typeof value === 'number' && value <= max,

    pattern: (regex: RegExp) => (value: string) => typeof value === 'string' && regex.test(value),

    oneOf: (options: any[]) => (value: any) => options.includes(value),

    array: (value: any) => Array.isArray(value),

    object: (value: any) => typeof value === 'object' && value !== null && !Array.isArray(value),

    uuid: (value: string) => {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    },

    price: (value: number) =>
      typeof value === 'number' &&
      value >= VALIDATION_RULES.PRICE_MIN &&
      value <= VALIDATION_RULES.PRICE_MAX,

    quantity: (value: number) =>
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value >= VALIDATION_RULES.QUANTITY_MIN &&
      value <= VALIDATION_RULES.QUANTITY_MAX,

    pluginId: (value: string) =>
      typeof value === 'string' && VALIDATION_RULES.PLUGIN_ID_PATTERN.test(value),

    orderId: (value: string) =>
      typeof value === 'string' && VALIDATION_RULES.ORDER_ID_PATTERN.test(value),
  };
}

// Pre-defined validation schemas
export const ValidationSchemas = {
  product: {
    rules: [
      {
        field: 'name',
        validator: Validator.validators.string,
        required: true,
        message: 'Product name must be a string',
      },
      {
        field: 'name',
        validator: Validator.validators.minLength(VALIDATION_RULES.PRODUCT_NAME_MIN_LENGTH),
        message: `Product name must be at least ${VALIDATION_RULES.PRODUCT_NAME_MIN_LENGTH} characters`,
      },
      {
        field: 'name',
        validator: Validator.validators.maxLength(VALIDATION_RULES.PRODUCT_NAME_MAX_LENGTH),
        message: `Product name must not exceed ${VALIDATION_RULES.PRODUCT_NAME_MAX_LENGTH} characters`,
      },
      {
        field: 'description',
        validator: Validator.validators.string,
        required: true,
      },
      {
        field: 'description',
        validator: Validator.validators.maxLength(VALIDATION_RULES.PRODUCT_DESCRIPTION_MAX_LENGTH),
        message: `Description must not exceed ${VALIDATION_RULES.PRODUCT_DESCRIPTION_MAX_LENGTH} characters`,
      },
      {
        field: 'price',
        validator: Validator.validators.price,
        required: true,
        message: 'Price must be a valid number within allowed range',
      },
      {
        field: 'pluginId',
        validator: Validator.validators.pluginId,
        required: true,
        message: 'Plugin ID must be a valid identifier',
      },
    ],
  } as ValidationSchema,

  order: {
    rules: [
      {
        field: 'userId',
        validator: Validator.validators.string,
        required: true,
      },
      {
        field: 'items',
        validator: Validator.validators.array,
        required: true,
        message: 'Order must contain at least one item',
      },
      {
        field: 'totalAmount',
        validator: Validator.validators.price,
        required: true,
      },
    ],
  } as ValidationSchema,

  user: {
    rules: [
      {
        field: 'telegramId',
        validator: Validator.validators.number,
        required: true,
      },
      {
        field: 'email',
        validator: Validator.validators.email,
        required: false,
      },
    ],
  } as ValidationSchema,

  pluginConfig: {
    rules: [
      {
        field: 'id',
        validator: Validator.validators.pluginId,
        required: true,
      },
      {
        field: 'name',
        validator: Validator.validators.string,
        required: true,
      },
      {
        field: 'version',
        validator: Validator.validators.string,
        required: true,
      },
    ],
  } as ValidationSchema,
};

// Utility functions
export const validateProduct = (product: any): ValidationResult =>
  Validator.validate(product, ValidationSchemas.product);

export const validateOrder = (order: any): ValidationResult =>
  Validator.validate(order, ValidationSchemas.order);

export const validateUser = (user: any): ValidationResult =>
  Validator.validate(user, ValidationSchemas.user);

export const validatePluginConfig = (config: any): ValidationResult =>
  Validator.validate(config, ValidationSchemas.pluginConfig);
