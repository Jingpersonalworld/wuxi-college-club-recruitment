import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { serviceClient } from "@/lib/supabase";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    z.uuid().parse(id);
    const db = serviceClient();
    const { data: submission, error } = await db.from("submissions").select("*").eq("id", id).neq("status", "draft").single();
    if (error || !submission) throw new ApiError("未找到投递记录", 404);
    const [project, files, reviews, history] = await Promise.all([
      db.from("projects").select("id,name,slug").eq("id", submission.project_id).single(),
      db.from("submission_files").select("id,kind,original_name,mime_type,file_size,uploaded_at").eq("submission_id", id),
      db.from("reviews").select("id,reviewer_id,score,comment,review_status,decision,updated_at").eq("submission_id", id).order("updated_at", { ascending: false }),
      db.from("submission_status_history").select("from_status,to_status,public_note,changed_by,created_at").eq("submission_id", id).order("created_at", { ascending: false }),
    ]);
    return NextResponse.json({ submission, project: project.data, files: files.data ?? [], reviews: reviews.data ?? [], history: history.data ?? [] });
  } catch (error) { return errorResponse(error); }
}
