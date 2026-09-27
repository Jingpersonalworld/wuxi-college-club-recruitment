import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse, readJson } from "@/lib/api";
import { finishSubmission } from "@/lib/submissions";

const schema = z.object({ submissionId: z.uuid(), trackingNo: z.string().regex(/^TD-[A-Z0-9]{10}$/), queryCode: z.string().length(12) });
export async function POST(request: Request) {
  try {
    const input = schema.parse(await readJson(request));
    return NextResponse.json(await finishSubmission(input.submissionId, input.trackingNo, input.queryCode));
  } catch (error) { return errorResponse(error); }
}
