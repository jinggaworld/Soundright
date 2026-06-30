import { NextResponse } from "next/server";

/**
 * Custom API error with status code and optional error code.
 *
 * @example
 * throw new ApiError(404, "Song not found", "SONG_NOT_FOUND");
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Handles API errors and returns consistent JSON error responses.
 * Maps Prisma-specific errors to user-friendly messages.
 *
 * @example
 * try {
 *   // API logic
 * } catch (error) {
 *   return handleApiError(error);
 * }
 */
export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    if (error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { success: false, error: "Resource already exists" },
        { status: 409 }
      );
    }

    if (error.message.includes("Record to update not found")) {
      return NextResponse.json(
        { success: false, error: "Resource not found" },
        { status: 404 }
      );
    }

    if (error.message.includes("Foreign key constraint")) {
      return NextResponse.json(
        { success: false, error: "Related resource not found" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}

/**
 * Wrapper for API route handlers that provides automatic error handling.
 *
 * @example
 * export const GET = withErrorHandling(async () => {
 *   const songs = await prisma.song.findMany();
 *   return successResponse(songs);
 * });
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    return handleApiError(error);
  }
}
