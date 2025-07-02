// ============================================================================
// CSRF Token Security Unit Tests
// ============================================================================

import { CSRFToken } from '../CSRFToken';

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
    CSRFToken.clearToken(); // Reset token state
  });

  describe('generateToken', () => {
    it('should generate a new CSRF token', () => {
      // Mock crypto.getRandomValues to return predictable values
      mockGetRandomValues.mockImplementation(array => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256;
        }
        return array;
      });

      const token = CSRFToken.generateToken();

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

      const token1 = CSRFToken.generateToken();
      const token2 = CSRFToken.generateToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('getToken', () => {
    it('should return existing token from sessionStorage', () => {
      const existingToken = 'existing-csrf-token-123';
      mockSessionStorage.getItem.mockReturnValue(existingToken);

      const token = CSRFToken.getToken();

      expect(token).toBe(existingToken);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('csrf_token');
    });

    it('should generate new token if none exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null);
      mockGetRandomValues.mockImplementation(array => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256;
        }
        return array;
      });

      const token = CSRFToken.getToken();

      expect(token).toBeDefined();
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    it('should validate correct token', () => {
      const validToken = 'valid-csrf-token-123';
      mockSessionStorage.getItem.mockReturnValue(validToken);

      const isValid = CSRFToken.validateToken(validToken);

      expect(isValid).toBe(true);
    });

    it('should reject invalid token', () => {
      const storedToken = 'stored-csrf-token-123';
      const invalidToken = 'invalid-csrf-token-456';
      mockSessionStorage.getItem.mockReturnValue(storedToken);

      const isValid = CSRFToken.validateToken(invalidToken);

      expect(isValid).toBe(false);
    });

    it('should reject empty token', () => {
      mockSessionStorage.getItem.mockReturnValue('valid-token');

      const isValid = CSRFToken.validateToken('');

      expect(isValid).toBe(false);
    });

    it('should reject null token', () => {
      mockSessionStorage.getItem.mockReturnValue('valid-token');

      const isValid = CSRFToken.validateToken(null as any);

      expect(isValid).toBe(false);
    });
  });

  describe('protectedFetch', () => {
    it('should add CSRF token to POST request headers', async () => {
      const mockToken = 'csrf-token-123';
      mockSessionStorage.getItem.mockReturnValue(mockToken);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await CSRFToken.protectedFetch('/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
        headers: {
          'X-CSRF-Token': mockToken,
        },
      });
    });

    it('should add CSRF token to PUT request headers', async () => {
      const mockToken = 'csrf-token-456';
      mockSessionStorage.getItem.mockReturnValue(mockToken);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      await CSRFToken.protectedFetch('/api/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: 1 }),
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': mockToken,
        },
        body: JSON.stringify({ id: 1 }),
      });
    });

    it('should not add CSRF token to GET requests', async () => {
      const mockToken = 'csrf-token-789';
      mockSessionStorage.getItem.mockReturnValue(mockToken);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await CSRFToken.protectedFetch('/api/data', {
        method: 'GET',
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/data', {
        method: 'GET',
      });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toBeUndefined();
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

      await CSRFToken.protectedFetch('/api/test', {
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
      const mockToken = 'csrf-token-error';
      mockSessionStorage.getItem.mockReturnValue(mockToken);

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        CSRFToken.protectedFetch('/api/error', {
          method: 'POST',
          body: JSON.stringify({ data: 'test' }),
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('clearToken', () => {
    it('should remove token from sessionStorage', () => {
      CSRFToken.clearToken();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('csrf_token');
    });
  });

  describe('refreshToken', () => {
    it('should generate new token and replace existing one', () => {
      const oldToken = 'old-csrf-token';
      mockSessionStorage.getItem.mockReturnValue(oldToken);
      mockGetRandomValues.mockImplementation(array => {
        for (let i = 0; i < array.length; i++) {
          array[i] = (i + 100) % 256;
        }
        return array;
      });

      const newToken = CSRFToken.refreshToken();

      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(oldToken);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('csrf_token', newToken);
    });
  });
});
