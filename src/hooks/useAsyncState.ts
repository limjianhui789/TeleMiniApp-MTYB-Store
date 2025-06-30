import { useState, useCallback, useRef, useEffect } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  success: boolean;
}

export interface AsyncStateOptions {
  initialData?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  resetOnExecute?: boolean;
}

export interface AsyncStateActions<T> {
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: Error) => void;
}

export function useAsyncState<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: AsyncStateOptions = {}
): [AsyncState<T>, AsyncStateActions<T>] {
  const { initialData = null, onSuccess, onError, resetOnExecute = true } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
    success: false,
  });

  const cancelRef = useRef<boolean>(false);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      success: false,
    });
  }, [initialData]);

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      error: null,
      success: true,
    }));
  }, []);

  const setError = useCallback((error: Error) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false,
      success: false,
    }));
  }, []);

  const execute = useCallback(
    async (...args: any[]): Promise<T> => {
      try {
        cancelRef.current = false;

        if (resetOnExecute) {
          setState(prev => ({
            ...prev,
            loading: true,
            error: null,
            success: false,
          }));
        } else {
          setState(prev => ({
            ...prev,
            loading: true,
            error: null,
          }));
        }

        const result = await asyncFunction(...args);

        if (cancelRef.current) {
          return result;
        }

        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
          error: null,
          success: true,
        }));

        onSuccess?.(result);
        return result;
      } catch (error) {
        if (cancelRef.current) {
          throw error;
        }

        const errorObj = error instanceof Error ? error : new Error(String(error));

        setState(prev => ({
          ...prev,
          error: errorObj,
          loading: false,
          success: false,
        }));

        onError?.(errorObj);
        throw errorObj;
      }
    },
    [asyncFunction, onSuccess, onError, resetOnExecute]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  const actions: AsyncStateActions<T> = {
    execute,
    reset,
    setData,
    setError,
  };

  return [state, actions];
}

// 专门用于数据获取的Hook
export function useFetch<T = any>(
  url: string | (() => string),
  options?: RequestInit & {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
): [AsyncState<T>, { refetch: () => Promise<T>; reset: () => void }] {
  const { immediate = true, onSuccess, onError, ...fetchOptions } = options || {};

  const fetchFunction = useCallback(async (): Promise<T> => {
    const fetchUrl = typeof url === 'function' ? url() : url;
    const response = await fetch(fetchUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }, [url, fetchOptions]);

  const [state, { execute, reset }] = useAsyncState<T>(fetchFunction, {
    onSuccess,
    onError,
  });

  const refetch = useCallback(() => execute(), [execute]);

  // Auto-fetch on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      refetch().catch(() => {
        // Error is already handled by useAsyncState
      });
    }
  }, [immediate, refetch]);

  return [state, { refetch, reset }];
}

// 专门用于表单提交的Hook
export function useSubmit<T = any, P = any>(
  submitFunction: (params: P) => Promise<T>,
  options?: {
    onSuccess?: (data: T, params: P) => void;
    onError?: (error: Error, params: P) => void;
  }
): [AsyncState<T>, { submit: (params: P) => Promise<T>; reset: () => void }] {
  const { onSuccess, onError } = options || {};

  const wrappedSubmitFunction = useCallback(
    async (params: P): Promise<T> => {
      try {
        const result = await submitFunction(params);
        onSuccess?.(result, params);
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        onError?.(errorObj, params);
        throw errorObj;
      }
    },
    [submitFunction, onSuccess, onError]
  );

  const [state, { execute, reset }] = useAsyncState<T>(wrappedSubmitFunction);

  const submit = useCallback((params: P) => execute(params), [execute]);

  return [state, { submit, reset }];
}

// 用于重试逻辑的Hook
export function useRetry<T = any>(
  asyncFunction: () => Promise<T>,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    exponentialBackoff?: boolean;
    onRetry?: (attempt: number, error: Error) => void;
    onMaxRetriesReached?: (error: Error) => void;
  }
): [AsyncState<T>, { execute: () => Promise<T>; retry: () => Promise<T>; reset: () => void }] {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onRetry,
    onMaxRetriesReached,
  } = options || {};

  const [retryCount, setRetryCount] = useState(0);

  const wrappedFunction = useCallback(async (): Promise<T> => {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFunction();
        setRetryCount(0); // Reset on success
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) {
          setRetryCount(attempt + 1);
          onRetry?.(attempt + 1, lastError);

          // Calculate delay
          const delay = exponentialBackoff ? retryDelay * Math.pow(2, attempt) : retryDelay;

          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          onMaxRetriesReached?.(lastError);
        }
      }
    }

    throw lastError!;
  }, [asyncFunction, maxRetries, retryDelay, exponentialBackoff, onRetry, onMaxRetriesReached]);

  const [state, { execute, reset: originalReset }] = useAsyncState<T>(wrappedFunction);

  const reset = useCallback(() => {
    setRetryCount(0);
    originalReset();
  }, [originalReset]);

  const retry = useCallback(() => execute(), [execute]);

  return [state, { execute, retry, reset }];
}

// 用于分页数据的Hook
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationOptions {
  initialPage?: number;
  pageSize?: number;
  onSuccess?: (data: PaginatedData<any>) => void;
  onError?: (error: Error) => void;
}

export function usePagination<T = any>(
  fetchFunction: (page: number, pageSize: number) => Promise<PaginatedData<T>>,
  options: PaginationOptions = {}
): [
  AsyncState<PaginatedData<T>>,
  {
    loadPage: (page: number) => Promise<PaginatedData<T>>;
    loadNext: () => Promise<PaginatedData<T>>;
    loadPrevious: () => Promise<PaginatedData<T>>;
    reset: () => void;
    currentPage: number;
    totalPages: number;
  },
] {
  const { initialPage = 1, pageSize = 10, onSuccess, onError } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);

  const wrappedFetchFunction = useCallback(
    async (page: number): Promise<PaginatedData<T>> => {
      const result = await fetchFunction(page, pageSize);
      setCurrentPage(page);
      return result;
    },
    [fetchFunction, pageSize]
  );

  const [state, { execute, reset: originalReset }] = useAsyncState<PaginatedData<T>>(
    wrappedFetchFunction,
    { onSuccess, onError }
  );

  const loadPage = useCallback((page: number) => execute(page), [execute]);

  const loadNext = useCallback(() => {
    if (state.data?.hasNextPage) {
      return loadPage(currentPage + 1);
    }
    return Promise.reject(new Error('No next page available'));
  }, [state.data?.hasNextPage, currentPage, loadPage]);

  const loadPrevious = useCallback(() => {
    if (state.data?.hasPreviousPage) {
      return loadPage(currentPage - 1);
    }
    return Promise.reject(new Error('No previous page available'));
  }, [state.data?.hasPreviousPage, currentPage, loadPage]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    originalReset();
  }, [initialPage, originalReset]);

  const totalPages = state.data ? Math.ceil(state.data.total / pageSize) : 0;

  // Auto-load first page
  useEffect(() => {
    loadPage(initialPage).catch(() => {
      // Error is handled by useAsyncState
    });
  }, [initialPage]); // Only run on mount

  return [
    state,
    {
      loadPage,
      loadNext,
      loadPrevious,
      reset,
      currentPage,
      totalPages,
    },
  ];
}
