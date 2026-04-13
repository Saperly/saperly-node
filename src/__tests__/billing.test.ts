import { describe, it, expect, vi, beforeEach } from "vitest";
import { Saperly } from "../index.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe("BillingResource", () => {
  const client = new Saperly({ apiKey: "sk_test_abc123" });

  it("balance returns camelCase fields", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ credits: 500, currency: "credits" }),
    );
    const balance = await client.billing.balance();
    expect(balance.credits).toBe(500);
    expect(balance.currency).toBe("credits");
  });

  it("addFunds sends snake_case body and returns checkoutUrl", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(
        { checkout_url: "https://checkout.lemonsqueezy.com/pay/abc123" },
        201,
      ),
    );
    const result = await client.billing.addFunds({ amountCredits: 2500 });
    expect(result.checkoutUrl).toBe(
      "https://checkout.lemonsqueezy.com/pay/abc123",
    );

    // Verify snake_case body was sent
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.amount_credits).toBe(2500);
  });

  it("transactions returns paginated list with camelCase fields", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        transactions: [
          {
            id: "txn-1",
            type: "signup_credit",
            amount_credits: 500,
            balance_after_credits: 500,
            description: "Signup credit",
            reference_id: null,
            reference_type: null,
            created_at: "2026-01-01T00:00:00Z",
          },
        ],
        has_more: true,
        next_cursor: "2026-01-01T00:00:00Z",
      }),
    );
    const result = await client.billing.transactions({ limit: 10 });
    expect(result.transactions[0].amountCredits).toBe(500);
    expect(result.transactions[0].balanceAfterCredits).toBe(500);
    expect(result.transactions[0].type).toBe("signup_credit");
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe("2026-01-01T00:00:00Z");
  });

  it("transactions passes query params in URL", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ transactions: [], has_more: false, next_cursor: null }),
    );
    await client.billing.transactions({
      limit: 5,
      cursor: "2026-01-01T00:00:00Z",
    });

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("limit=5");
    expect(url).toContain("cursor=");
  });
});
