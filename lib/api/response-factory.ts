import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export class ApiResponse {
  static success<T>(data: T, status = 200): NextResponse {
    return NextResponse.json(data, { status });
  }

  static created<T>(data: T): NextResponse {
    return NextResponse.json(data, { status: 201 });
  }

  static badRequest(message = "Invalid request"): NextResponse {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  static unauthorized(message = "Unauthorized"): NextResponse {
    return NextResponse.json({ error: message }, { status: 401 });
  }

  static forbidden(message = "Forbidden"): NextResponse {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  static notFound(message = "Not found"): NextResponse {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  static conflict(message = "Conflict"): NextResponse {
    return NextResponse.json({ error: message }, { status: 409 });
  }

  static validationError(errors: ZodError): NextResponse {
    const formatted = errors.flatten();
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatted.fieldErrors,
      },
      { status: 400 }
    );
  }

  static internalError(
    message = "Internal server error",
    isDev = process.env.NODE_ENV === "development"
  ): NextResponse {
    return NextResponse.json(
      {
        error: message,
        ...(isDev && { details: "Check server logs for details" }),
      },
      { status: 500 }
    );
  }

  static tooManyRequests(message = "Too many requests"): NextResponse {
    return NextResponse.json({ error: message }, { status: 429 });
  }
}
