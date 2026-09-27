import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET(request: Request) {
  try { return NextResponse.json(await requireAdmin(request)); }
  catch (error) { return errorResponse(error); }
}
