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

    const fetchOptions: RequestInit = { method, headers };

    if (options?.body) {
      fetchOptions.body = JSON.stringify(toSnakeCase(options.body as Record<string, unknown>));
    }

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      throw SaperlyError.fromResponse(res.status, errorBody);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    const json: unknown = await res.json();
    return toCamelCase<T>(json);
  }
}
