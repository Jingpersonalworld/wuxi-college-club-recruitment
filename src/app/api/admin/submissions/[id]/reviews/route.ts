import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ApiError, errorResponse, readJson } from "@/lib/api";
import { serviceClient } from "@/lib/supabase";
import { reviewSchema } from "@/lib/validation";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    z.uuid().parse(id);
    const input = reviewSchema.parse(await readJson(request));
    const db = serviceClient();
    const { data: submission } = await db.from("submissions").select("id").eq("id", id).neq("status", "draft").single();
    if (!submission) throw new ApiError("未找到投递记录", 404);
    const { data, error } = await db.from("reviews").upsert({ submission_id: id, reviewer_id: admin.userId, score: input.score, comment: input.comment, review_status: input.reviewStatus, decision: input.decision, updated_at: new Date().toISOString() }, { onConflict: "submission_id,reviewer_id" }).select("*").single();
    if (error) throw error;
    await db.from("audit_logs").insert({ user_id: admin.userId, action: "review.save", resource_type: "submission", resource_id: id });
    return NextResponse.json({ review: data });
  } catch (error) { return errorResponse(error); }
}
