import type { SaperlyClient } from "../client.js";
import type {
  ApiKey,
  ApiKeyEnvironment,
  ApiKeyListResult,
  ApiKeySettablePermission,
  CreateApiKeyResponse,
} from "../types.js";

export interface CreateKeyParams {
  name: string;
  agentLabel?: string;
  lineId?: string;
  /** Defaults to `"full"` server-side when omitted. */
  permissions?: ApiKeySettablePermission;
  monthlyCapCents?: number;
  environment?: ApiKeyEnvironment;
  /** Idempotency-Key. Auto-generated UUID v4 if omitted. */
  idempotencyKey?: string;
}

export interface ListKeysParams {
  /** 1..100, default 50 server-side. */
  limit?: number;
  /** >=0, default 0 server-side. */
  offset?: number;
}

export interface UpdateKeyParams {
  name?: string;
  agentLabel?: string | null;
  lineId?: string | null;
  permissions?: ApiKeySettablePermission;
  monthlyCapCents?: number | null;
}

/**
 * v0.5.7.0 (Phase Maturity 2 / Team 2) — agent API keys. Lifecycle:
 * create → list/get → update → rotate (revokes old + mints new) →
 * delete (soft revoke; row remains in `get` responses with
 * `revokedAt` set).
 *
 * `create` and `rotate` are idempotent: the SDK auto-generates a UUID
 * v4 `Idempotency-Key` header when one is not supplied. Pass your own
 * via `idempotencyKey` if you want to retry safely across process
 * boundaries.
 */
export class KeysResource {
  constructor(private client: SaperlyClient) {}

  async create(params: CreateKeyParams): Promise<CreateApiKeyResponse> {
    const { idempotencyKey, ...body } = params;
    const idemKey = idempotencyKey ?? crypto.randomUUID();
    const res = await this.client.request<{ key: CreateApiKeyResponse }>(
      "POST",
      "/keys",
      {
        body,
        headers: { "Idempotency-Key": idemKey },
      },
    );
    return res.key;
  }

  async list(params?: ListKeysParams): Promise<ApiKeyListResult> {
    return this.client.request<ApiKeyListResult>("GET", "/keys", {
      query: { limit: params?.limit, offset: params?.offset },
    });
  }

  async get(keyId: string): Promise<ApiKey> {
    const res = await this.client.request<{ key: ApiKey }>(
      "GET",
      `/keys/${encodeURIComponent(keyId)}`,
    );
    return res.key;
  }

  async update(keyId: string, params: UpdateKeyParams): Promise<ApiKey> {
    const res = await this.client.request<{ key: ApiKey }>(
      "PATCH",
      `/keys/${encodeURIComponent(keyId)}`,
      { body: params },
    );
    return res.key;
  }

  /** Soft-revokes the key. The returned ApiKey has `revokedAt` set. */
  async delete(keyId: string): Promise<ApiKey> {
    const res = await this.client.request<{ key: ApiKey }>(
      "DELETE",
      `/keys/${encodeURIComponent(keyId)}`,
    );
    return res.key;
  }

  async rotate(
    keyId: string,
    opts?: { idempotencyKey?: string },
  ): Promise<CreateApiKeyResponse> {
    const idemKey = opts?.idempotencyKey ?? crypto.randomUUID();
    const res = await this.client.request<{ key: CreateApiKeyResponse }>(
      "POST",
      `/keys/${encodeURIComponent(keyId)}/rotate`,
      {
        headers: { "Idempotency-Key": idemKey },
      },
    );
    return res.key;
  }
}
