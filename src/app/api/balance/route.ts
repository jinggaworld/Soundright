import { NextRequest } from "next/server";
import "@/lib/server-init";
import { getBalance } from "@/lib/casper";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return Response.json({ error: "Missing address param" }, { status: 400 });
  }

  try {
    const balance = await getBalance(address);
    return Response.json({ balance });
  } catch (error) {
    console.warn("Balance API error:", error);
    return Response.json({ balance: 0, error: "Balance unavailable" });
  }
}
