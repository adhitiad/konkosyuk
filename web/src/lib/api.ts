import { ApiError, getAxiosInstance } from "./api.client";
import { logError } from "./logger";
import { ZodError } from "zod";
import {
  ApiError as AppApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
} from "./api-error";

export { ApiError, getAxiosInstance };
export {
  AppApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
};

export function ok(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export function handleApiError(error: unknown, context?: string) {
  if (error instanceof AppApiError) {
    logError(error, context || "API_ERROR", {
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    });
    return Response.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    const message = error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    logError(error, context || "API_VALIDATION_ERROR", {
      issues: error.issues,
    });
    return Response.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message,
          details: error.issues,
        },
      },
      { status: 422 },
    );
  }

  if (error instanceof Error) {
    logError(error, context || "API_ERROR");

    if (error.message === "Tidak berwenang") {
      return Response.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Tidak berwenang" },
        },
        { status: 401 },
      );
    }
    if (error.message === "Dilarang") {
      return Response.json(
        { success: false, error: { code: "FORBIDDEN", message: "Dilarang" } },
        { status: 403 },
      );
    }

    const sensitivePatterns = [
      /SELECT.*FROM/i,
      /INSERT.*INTO/i,
      /UPDATE.*SET/i,
      /DELETE.*FROM/i,
      /password/i,
      /secret/i,
      /token/i,
      /credential/i,
      /at\s+[\w.$]+/i,
      /stack trace/i,
      /database/i,
      /query/i,
      /sql/i,
      /connection/i,
    ];

    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : sensitivePatterns.some((p) => p.test(error.message))
          ? "An internal error occurred"
          : error.message;

    return Response.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message } },
      { status: 500 },
    );
  }

  logError(new Error("Unknown error"), context || "API_ERROR");
  return Response.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    },
    { status: 500 },
  );
}
