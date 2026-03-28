import { describe, it, expect } from "vitest";
import {
  SaperlyError,
  ValidationError,
  ConsentRequiredError,
} from "../errors.js";

describe("SaperlyError.fromResponse", () => {
  it("maps validation_error to ValidationError with details", () => {
    const err = SaperlyError.fromResponse(422, {
      error: {
        code: "validation_error",
        message: "Request validation failed.",
        details: [{ field: "name", message: "Required" }],
      },
    });

    expect(err).toBeInstanceOf(ValidationError);
    expect(err.code).toBe("validation_error");
    expect(err.status).toBe(422);
    expect(err.details).toHaveLength(1);
    expect(err.details[0].field).toBe("name");
  });

  it("maps consent_required to ConsentRequiredError", () => {
    const err = SaperlyError.fromResponse(403, {
      error: {
        code: "consent_required",
        message: "Outbound calls require explicit consent.",
      },
    });

    expect(err).toBeInstanceOf(ConsentRequiredError);
    expect(err.code).toBe("consent_required");
    expect(err.status).toBe(403);
  });

  it("maps unknown error code to base SaperlyError", () => {
    const err = SaperlyError.fromResponse(418, {
      error: {
        code: "teapot",
        message: "I'm a teapot",
      },
    });

    expect(err).toBeInstanceOf(SaperlyError);
    expect(err.code).toBe("teapot");
    expect(err.status).toBe(418);
  });

  it("handles null body gracefully", () => {
    const err = SaperlyError.fromResponse(500, null);

    expect(err).toBeInstanceOf(SaperlyError);
    expect(err.code).toBe("unknown");
    expect(err.message).toBe("An unexpected error occurred");
    expect(err.status).toBe(500);
  });
});
