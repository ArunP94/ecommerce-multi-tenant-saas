import useSWR, { SWRConfiguration } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("API request failed");
    error.cause = await res.json().catch(() => ({}));
    throw error;
  }
  return res.json();
};

export interface UseFetchOptions extends SWRConfiguration {
  enabled?: boolean;
}

export function useFetch<T = unknown>(
  url: string | null,
  options?: UseFetchOptions
) {
  const { enabled = true, ...swrOptions } = options || {};

  const { data, error, isLoading, mutate } = useSWR<T>(
    enabled && url ? url : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
      focusThrottleInterval: 300000,
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      ...swrOptions,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useFetchPost<T = unknown>(url: string) {
  return async (payload: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = new Error("API request failed");
      error.cause = await res.json().catch(() => ({}));
      throw error;
    }

    return (await res.json()) as T;
  };
}
