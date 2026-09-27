import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { ApiError, errorResponse, readJson } from "@/lib/api";
import { startSubmission, startSchema } from "@/lib/submissions";
import { serviceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const input = startSchema.parse(await readJson(request));
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const rateKey = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "").update(`${ip}:${input.projectId}`).digest("hex");
    const { data: allowed, error: rateError } = await serviceClient().rpc("allow_submission_attempt", { p_rate_key: rateKey });
    if (rateError) throw rateError;
    if (!allowed) throw new ApiError("提交过于频繁，请稍后再试", 429);
    return NextResponse.json(await startSubmission(input), { status: 201 });
  } catch (error) { return errorResponse(error); }
}
