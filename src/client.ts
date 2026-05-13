import { SaperlyError } from "./errors.js";
import { toCamelCase, toSnakeCase } from "./utils.js";

export const DEFAULT_BASE_URL = "https://saperly-production.up.railway.app";

export interface SaperlyClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface RequestOptions {
  body?: object;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
}

export class SaperlyClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: SaperlyClientConfig) {
    if (!config.apiKey) {
      throw new Error("apiKey is required");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  private static readonly RETRYABLE_METHODS = new Set(["GET", "DELETE", "HEAD", "OPTIONS"]);

  async request<T>(method: string, path: string, options?: RequestOptions): Promise<T> {
    let url = `${this.baseUrl}/api/v1${path}`;

    if (options?.query) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          params.set(key, String(value));
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    if (options?.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        const lower = k.toLowerCase();
        if (lower === "authorization" || lower === "content-type") continue;
        // Defense-in-depth: runtime fetch rejects CRLF in header values, but
        // an SDK consumer composing headers from untrusted input deserves an
        // early, named error instead of a generic TypeError from undici.
        if (/[\r\n]/.test(k) || /[\r\n]/.test(v)) {
          throw new Error(`invalid header: CRLF not allowed (${k})`);
        }
        headers[k] = v;
      }
    }

    const fetchOptions: RequestInit = { method, headers };

    if (options?.body) {
      fetchOptions.body = JSON.stringify(toSnakeCase(options.body as Record<string, unknown>));
    }

    const isRetryable = SaperlyClient.RETRYABLE_METHODS.has(method.toUpperCase());
    const maxAttempts = isRetryable ? 2 : 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url, fetchOptions);

        if (res.status >= 500 && isRetryable && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        if (!res.ok) {
          const errorBody = await res.json().catch(() => null);
          throw SaperlyError.fromResponse(res.status, errorBody);
        }

        if (res.status === 204) {
          return undefined as T;
        }

        const json: unknown = await res.json();
        return toCamelCase<T>(json);
      } catch (err) {
        if (err instanceof SaperlyError) throw err;
        lastError = err;
        if (isRetryable && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  }
}
