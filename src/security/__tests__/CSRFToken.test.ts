// ============================================================================
// CSRF Token Security Unit Tests
// ============================================================================

import { CSRFToken, CSRFProtection } from '../CSRFToken';

// Mock crypto.getRandomValues for testing
const mockGetRandomValues = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
  },
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('CSRFToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CSRFToken.clear(); // Reset token state
  });

  describe('generate', () => {
    it('should generate a new CSRF token', () => {
      // Mock crypto.getRandomValues to return predictable values
      mockGetRandomValues.mockImplementation(array => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256;
        }
        return array;
      });

      const token = CSRFToken.generate();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('csrf_token', token);
    });

    it('should generate different tokens on subsequent calls', () => {
      mockGetRandomValues.mockImplementation(array => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      });

      const token1 = CSRFToken.generate();
      const token2 = CSRFToken.generate();

      expect(token1).not.toBe(token2);
    });
  });

  describe('getCurrent', () => {
    it('should return existing token from sessionStorage', () => {
      const tokenData = { token: 'test-token', timestamp: Date.now() };
      const existingToken = btoa(JSON.stringify(tokenData));
      mockSessionStorage.getItem.mockReturnValue(existingToken);

      const token = CSRFToken.getCurrent();

      expect(token).toBe(existingToken);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('csrf_token');
    });

    it('should return null if no token exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const token = CSRFToken.getCurrent();

      expect(token).toBeNull();
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('should validate correct token', () => {
      const tokenData = { token: 'test-token', timestamp: Date.now() };
      const validToken = btoa(JSON.stringify(tokenData));
      mockSessionStorage.getItem.mockReturnValue(validToken);

      const isValid = CSRFToken.validate(validToken);

      expect(isValid).toBe(true);
    });

    it('should reject invalid token', () => {
      const storedToken = 'stored-csrf-token-123';
      const invalidToken = 'invalid-csrf-token-456';
      mockSessionStorage.getItem.mockReturnValue(storedToken);

      const isValid = CSRFToken.validate(invalidToken);

      expect(isValid).toBe(false);
    });

    it('should reject empty token', () => {
      mockSessionStorage.getItem.mockReturnValue('valid-token');

      const isValid = CSRFToken.validate('');

      expect(isValid).toBe(false);
    });

    it('should reject null token', () => {
      mockSessionStorage.getItem.mockReturnValue('valid-token');

      const isValid = CSRFToken.validate(null as any);

      expect(isValid).toBe(false);
    });
  });

  describe('CSRFProtection', () => {
    it('should add CSRF token to POST request headers', async () => {
      const mockToken = 'csrf-token-123';
      mockSessionStorage.getItem.mockReturnValue(mockToken);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await CSRFProtection.createProtectedFetch()('/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
          headers: expect.objectContaining({
            'X-CSRF-Token': expect.any(String),
          }),
        }),
      );
    });

    it('should add CSRF token to PUT request headers', async () => {
      const mockToken = 'csrf-token-456';
      mockSessionStorage.getItem.mockReturnValue(mockToken);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await CSRFProtection.createProtectedFetch()('/api/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: 1 }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/update',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-CSRF-Token': expect.any(String),
          }),
          body: JSON.stringify({ id: 1 }),
        }),
      );
    });

    it('should not add CSRF token to GET requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await CSRFProtection.createProtectedFetch()('/api/data', {
        method: 'GET',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/data',
        expect.not.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': expect.any(String),
          }),
        }),
      );
    });

    it('should generate token if none exists for protected requests', async () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      mockGetRandomValues.mockImplementation(array => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256;
        }
        return array;
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await CSRFProtection.createProtectedFetch()('/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': expect.any(String),
          }),
        })
      );
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        CSRFProtection.createProtectedFetch()('/api/error', {
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('clear', () => {
    it('should remove token from sessionStorage', () => {
      CSRFToken.clear();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('csrf_token');
    });
  });
});
