export interface SaperlyErrorDetail {
  field?: string;
  message: string;
}

export class SaperlyError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: SaperlyErrorDetail[];

  constructor(code: string, status: number, message: string, details: SaperlyErrorDetail[] = []) {
    super(message);
    this.name = "SaperlyError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static fromResponse(status: number, body: unknown): SaperlyError {
    const parsed = body as { error?: { code?: string; message?: string; details?: SaperlyErrorDetail[] } } | null;
    const code = parsed?.error?.code ?? "unknown";
    const message = parsed?.error?.message ?? "An unexpected error occurred";
    const details = parsed?.error?.details ?? [];

    switch (code) {
      case "validation_error":
        return new ValidationError(message, status, details);
      case "invalid_api_key":
      case "unauthorized":
        return new AuthenticationError(message, status);
      case "forbidden":
        return new ForbiddenError(message, status);
      case "not_found":
      case "call_not_found":
        return new NotFoundError(message, status);
      case "consent_required":
        return new ConsentRequiredError(message, status);
      case "consent_already_granted":
        return new ConsentAlreadyGrantedError(message, status);
      case "call_in_progress":
        return new CallInProgressError(message, status);
      case "call_not_active":
        return new CallNotActiveError(message, status);
      case "insufficient_credits":
        return new InsufficientCreditsError(message, status);
      case "number_opted_out":
        return new NumberOptedOutError(message, status);
      case "email_taken":
        return new EmailTakenError(message, status);
      default:
        return new SaperlyError(code, status, message, details);
    }
  }
}

export class ValidationError extends SaperlyError {
  constructor(message: string, status = 422, details: SaperlyErrorDetail[] = []) {
    super("validation_error", status, message, details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends SaperlyError {
  constructor(message: string, status = 401) {
    super("invalid_api_key", status, message);
    this.name = "AuthenticationError";
  }
}

export class ForbiddenError extends SaperlyError {
  constructor(message: string, status = 403) {
    super("forbidden", status, message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends SaperlyError {
  constructor(message: string, status = 404) {
    super("not_found", status, message);
    this.name = "NotFoundError";
  }
}

export class ConsentRequiredError extends SaperlyError {
  constructor(message: string, status = 403) {
    super("consent_required", status, message);
    this.name = "ConsentRequiredError";
  }
}

export class ConsentAlreadyGrantedError extends SaperlyError {
  constructor(message: string, status = 409) {
    super("consent_already_granted", status, message);
    this.name = "ConsentAlreadyGrantedError";
  }
}

export class CallInProgressError extends SaperlyError {
  constructor(message: string, status = 409) {
    super("call_in_progress", status, message);
    this.name = "CallInProgressError";
  }
}

export class CallNotActiveError extends SaperlyError {
  constructor(message: string, status = 409) {
    super("call_not_active", status, message);
    this.name = "CallNotActiveError";
  }
}

export class InsufficientCreditsError extends SaperlyError {
  constructor(message: string, status = 402) {
    super("insufficient_credits", status, message);
    this.name = "InsufficientCreditsError";
  }
}

export class NumberOptedOutError extends SaperlyError {
  constructor(message: string, status = 403) {
    super("number_opted_out", status, message);
    this.name = "NumberOptedOutError";
  }
}

export class EmailTakenError extends SaperlyError {
  constructor(message: string, status = 409) {
    super("email_taken", status, message);
    this.name = "EmailTakenError";
  }
}
