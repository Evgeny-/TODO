import { useCallback, useEffect, useState } from 'react';
import { getJwtAuthToken } from './user-storage';

export async function apiRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
): Promise<T> {
  const url = `${window.env.BACKEND_URL}${path}`;

  const jwtToken = getJwtAuthToken();

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: jwtToken ? `Bearer ${jwtToken}` : '',
    },
    body: body && JSON.stringify(body),
  });

  if (!response.ok) {
    let error: string = response.statusText;
    try {
      const jsonError = (await response.json()) as { error: string };
      error = jsonError.error || error;
    } catch (e) {}
    throw new Error(error);
  }

  return response.json();
}

export function useApiRequest<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiRequest<T>(path);
      setData(res);
    } catch (e) {
      setError(e as Error);
    }

    setIsLoading(false);
  }, [path]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    fetchData,
  };
}
