const DEFAULT_TIMEOUT_MS = 8_000;

// GETs JSON, failing after a timeout so a slow service doesn't block the
// fallback to the next weather source.
export async function fetchJson<T>(
  url: string,
  { headers, timeoutMs = DEFAULT_TIMEOUT_MS }: { headers?: Record<string, string>; timeoutMs?: number } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
