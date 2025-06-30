import { body, param, query, ValidationChain } from 'express-validator';

// Common validation rules
export const commonValidators = {
  uuid: param('id').isUUID().withMessage('Invalid UUID format'),
  
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  username: body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  name: (field: string) => body(field)
    .isLength({ min: 1, max: 255 })
    .withMessage(`${field} is required and must be less than 255 characters`)
    .trim(),

  optionalName: (field: string) => body(field)
    .optional()
    .isLength({ max: 255 })
    .withMessage(`${field} must be less than 255 characters`)
    .trim(),

  url: (field: string) => body(field)
    .optional()
    .isURL()
    .withMessage(`${field} must be a valid URL`),

  description: body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Description must be less than 5000 characters')
    .trim(),

  version: body('version')
    .matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/)
    .withMessage('Version must follow semantic versioning (e.g., 1.0.0)'),

  price: body('price')
    .isFloat({ min: 0, max: 9999.99 })
    .withMessage('Price must be between 0 and 9999.99'),

  rating: body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  tags: body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags: string[]) => {
      if (tags.length > 10) {
        throw new Error('Maximum 10 tags allowed');
      }
      for (const tag of tags) {
        if (typeof tag !== 'string' || tag.length > 50) {
          throw new Error('Each tag must be a string with maximum 50 characters');
        }
      }
      return true;
    }),

  category: (validCategories: string[]) => body('category')
    .isIn(validCategories)
    .withMessage(`Category must be one of: ${validCategories.join(', ')}`),

  paginationQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sort')
      .optional()
      .isIn(['name', 'created_at', 'updated_at', 'rating', 'downloads', 'price'])
      .withMessage('Invalid sort field'),
    query('order')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Order must be asc or desc')
  ],

  searchQuery: query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .trim()
};

// Auth validation rules
export const authValidators = {
  login: [
    commonValidators.email,
    body('password').isLength({ min: 1 }).withMessage('Password is required')
  ],

  register: [
    commonValidators.email,
    commonValidators.password,
    commonValidators.username,
    commonValidators.name('firstName'),
    commonValidators.optionalName('lastName')
  ],

  changePassword: [
    body('currentPassword').isLength({ min: 1 }).withMessage('Current password is required'),
    commonValidators.password.withMessage('New password must meet requirements')
  ],

  refreshToken: [
    body('refreshToken').isLength({ min: 1 }).withMessage('Refresh token is required')
  ],

  twoFactorCode: [
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('Two-factor code must be 6 digits')
      .matches(/^\d{6}$/)
      .withMessage('Two-factor code must contain only digits')
  ]
};

// Plugin validation rules
export const pluginValidators = {
  create: [
    commonValidators.name('name'),
    commonValidators.name('displayName'),
    commonValidators.description,
    commonValidators.version,
    commonValidators.category(['vpn', 'streaming', 'gaming', 'software', 'productivity', 'security', 'entertainment', 'utilities']),
    body('pricingType')
      .isIn(['free', 'freemium', 'paid', 'subscription'])
      .withMessage('Pricing type must be free, freemium, paid, or subscription'),
    commonValidators.price,
    commonValidators.tags,
    commonValidators.url('homepageUrl'),
    commonValidators.url('repositoryUrl'),
    commonValidators.url('documentationUrl'),
    body('supportEmail')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Support email must be valid'),
    body('license')
      .optional()
      .isLength({ max: 100 })
      .withMessage('License must be less than 100 characters'),
    body('requiredPermissions')
      .optional()
      .isArray()
      .withMessage('Required permissions must be an array'),
    body('supportedDevices')
      .optional()
      .isArray()
      .withMessage('Supported devices must be an array')
  ],

  update: [
    commonValidators.uuid,
    commonValidators.optionalName('displayName'),
    body('description').optional().isLength({ max: 5000 }).trim(),
    body('version')
      .optional()
      .matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/)
      .withMessage('Version must follow semantic versioning'),
    body('pricingType')
      .optional()
      .isIn(['free', 'freemium', 'paid', 'subscription']),
    body('price')
      .optional()
      .isFloat({ min: 0, max: 9999.99 }),
    commonValidators.tags,
    commonValidators.url('homepageUrl'),
    commonValidators.url('repositoryUrl'),
    commonValidators.url('documentationUrl')
  ],

  search: [
    ...commonValidators.paginationQuery,
    commonValidators.searchQuery,
    query('category')
      .optional()
      .isIn(['vpn', 'streaming', 'gaming', 'software', 'productivity', 'security', 'entertainment', 'utilities']),
    query('pricingType')
      .optional()
      .isIn(['free', 'freemium', 'paid', 'subscription']),
    query('minRating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Minimum rating must be between 0 and 5'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number')
  ],

  install: [
    commonValidators.uuid,
    body('version')
      .optional()
      .matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/)
      .withMessage('Version must follow semantic versioning'),
    body('autoUpdate')
      .optional()
      .isBoolean()
      .withMessage('Auto update must be a boolean')
  ]
};

// Review validation rules
export const reviewValidators = {
  create: [
    body('pluginId').isUUID().withMessage('Valid plugin ID is required'),
    commonValidators.rating,
    body('title')
      .optional()
      .isLength({ max: 255 })
      .withMessage('Title must be less than 255 characters')
      .trim(),
    body('comment')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Comment must be less than 2000 characters')
      .trim(),
    body('pros')
      .optional()
      .isArray()
      .withMessage('Pros must be an array')
      .custom((pros: string[]) => {
        if (pros.length > 5) {
          throw new Error('Maximum 5 pros allowed');
        }
        for (const pro of pros) {
          if (typeof pro !== 'string' || pro.length > 100) {
            throw new Error('Each pro must be a string with maximum 100 characters');
          }
        }
        return true;
      }),
    body('cons')
      .optional()
      .isArray()
      .withMessage('Cons must be an array')
      .custom((cons: string[]) => {
        if (cons.length > 5) {
          throw new Error('Maximum 5 cons allowed');
        }
        for (const con of cons) {
          if (typeof con !== 'string' || con.length > 100) {
            throw new Error('Each con must be a string with maximum 100 characters');
          }
        }
        return true;
      })
  ],

  update: [
    commonValidators.uuid,
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 }),
    body('title')
      .optional()
      .isLength({ max: 255 })
      .trim(),
    body('comment')
      .optional()
      .isLength({ max: 2000 })
      .trim()
  ],

  vote: [
    commonValidators.uuid,
    body('helpful')
      .isBoolean()
      .withMessage('Helpful must be a boolean value')
  ]
};

// Order validation rules
export const orderValidators = {
  create: [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Order must contain at least one item'),
    body('items.*.pluginId')
      .isUUID()
      .withMessage('Each item must have a valid plugin ID'),
    body('items.*.quantity')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Quantity must be between 1 and 100'),
    body('paymentMethod')
      .optional()
      .isIn(['card', 'paypal', 'crypto'])
      .withMessage('Payment method must be card, paypal, or crypto'),
    body('billingAddress')
      .optional()
      .isObject()
      .withMessage('Billing address must be an object')
  ],

  updateStatus: [
    commonValidators.uuid,
    body('status')
      .isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'])
      .withMessage('Invalid order status')
  ]
};

// User validation rules
export const userValidators = {
  updateProfile: [
    commonValidators.optionalName('firstName'),
    commonValidators.optionalName('lastName'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('bio')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Bio must be less than 1000 characters')
      .trim(),
    commonValidators.url('websiteUrl'),
    commonValidators.url('githubUrl'),
    body('twitterHandle')
      .optional()
      .matches(/^@?[a-zA-Z0-9_]{1,15}$/)
      .withMessage('Invalid Twitter handle'),
    body('company')
      .optional()
      .isLength({ max: 255 })
      .trim(),
    body('location')
      .optional()
      .isLength({ max: 255 })
      .trim()
  ],

  updateRole: [
    commonValidators.uuid,
    body('role')
      .isIn(['user', 'developer', 'moderator', 'admin'])
      .withMessage('Invalid user role')
  ],

  updateStatus: [
    commonValidators.uuid,
    body('status')
      .isIn(['active', 'suspended', 'banned', 'pending_verification'])
      .withMessage('Invalid user status'),
    body('reason')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Reason must be less than 500 characters')
      .trim()
  ]
};

// File upload validation
export const fileValidators = {
  pluginPackage: {
    fileFilter: (req: any, file: any, cb: any) => {
      if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
        cb(null, true);
      } else {
        cb(new Error('Only ZIP files are allowed for plugin packages'), false);
      }
    },
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB
    }
  },

  image: {
    fileFilter: (req: any, file: any, cb: any) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB
    }
  }
};

// Custom validation helpers
export const customValidators = {
  isValidSemVer: (value: string) => {
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(value);
  },

  isValidPluginName: (value: string) => {
    return /^[a-z0-9-]+$/.test(value) && value.length >= 3 && value.length <= 50;
  },

  isArrayOfStrings: (value: any, maxLength: number = 100) => {
    return Array.isArray(value) && value.every(item => 
      typeof item === 'string' && item.length <= maxLength
    );
  },

  isValidPermission: (value: string) => {
    const validPermissions = [
      'network', 'storage', 'camera', 'microphone', 'location', 
      'notifications', 'clipboard', 'fullscreen', 'crypto'
    ];
    return validPermissions.includes(value);
  },

  isValidDevice: (value: string) => {
    const validDevices = ['mobile', 'desktop', 'tablet', 'tv'];
    return validDevices.includes(value);
  }
};

// Validation middleware factory
export function createValidationMiddleware(validators: ValidationChain[]) {
  return [...validators];
}

export default {
  common: commonValidators,
  auth: authValidators,
  plugin: pluginValidators,
  review: reviewValidators,
  order: orderValidators,
  user: userValidators,
  file: fileValidators,
  custom: customValidators,
  createValidationMiddleware
};