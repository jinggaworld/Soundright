import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data } as ApiResponse<T>, {
    status,
  });
}

export function errorResponse(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error } as ApiResponse, {
    status,
  });
}

export function notFoundResponse(resource = "Resource"): NextResponse {
  return errorResponse(`${resource} not found`, 404);
}

export function unauthorizedResponse(
  message = "Unauthorized"
): NextResponse {
  return errorResponse(message, 401);
}
