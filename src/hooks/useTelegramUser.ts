// ============================================================================
// Telegram User Hook
// ============================================================================

import { useState, useEffect } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface UseTelegramUserReturn {
  user: TelegramUser | null;
  userId: string;
  isLoading: boolean;
  error: string | null;
}

export const useTelegramUser = (): UseTelegramUserReturn => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check if we're in Telegram WebApp environment
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;

        // Get user data from initDataUnsafe
        if (tg.initDataUnsafe?.user) {
          setUser(tg.initDataUnsafe.user);
        } else {
          // Fallback for development/testing
          setUser({
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
          });
        }
      } else {
        // Development fallback
        setUser({
          id: 123456789,
          first_name: 'Dev',
          last_name: 'User',
          username: 'devuser',
        });
      }
    } catch (err) {
      setError('Failed to get user information');
      console.error('Error getting Telegram user:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const userId = user ? `tg_${user.id}` : 'anonymous_user';

  return {
    user,
    userId,
    isLoading,
    error,
  };
};
