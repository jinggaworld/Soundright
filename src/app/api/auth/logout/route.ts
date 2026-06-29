import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-response";

export async function POST() {
  const response = successResponse({ message: "Logged out successfully" });

  // Clear session cookie
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
