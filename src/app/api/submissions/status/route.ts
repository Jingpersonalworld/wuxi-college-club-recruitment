import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, errorResponse, readJson } from "@/lib/api";
import { verifyQueryCode } from "@/lib/security";
import { serviceClient } from "@/lib/supabase";

const schema = z.object({ trackingNo: z.string().regex(/^TD-[A-Z0-9]{10}$/), queryCode: z.string().length(12) });
export async function POST(request: Request) {
  try {
    const input = schema.parse(await readJson(request));
    const db = serviceClient();
    const { data } = await db.from("submissions")
      .select("id,project_id,tracking_no,query_token_hash,status,public_note,submitted_at")
      .eq("tracking_no", input.trackingNo).neq("status", "draft").single();
    if (!data || !verifyQueryCode(input.queryCode, data.query_token_hash)) throw new ApiError("投递编号或查询密码不正确", 404);
    const { data: project } = await db.from("projects").select("name").eq("id", data.project_id).single();
    const { data: history } = await db.from("submission_status_history").select("to_status,public_note,created_at").eq("submission_id", data.id).order("created_at", { ascending: true });
    return NextResponse.json({ submission: { trackingNo: data.tracking_no, status: data.status, publicNote: data.public_note, submittedAt: data.submitted_at, projectName: project?.name ?? "投递项目", history } });
  } catch (error) { return errorResponse(error); }
}
