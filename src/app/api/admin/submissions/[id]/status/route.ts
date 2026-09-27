import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ApiError, errorResponse, readJson } from "@/lib/api";
import { serviceClient } from "@/lib/supabase";
import { statusSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    z.uuid().parse(id);
    const input = statusSchema.parse(await readJson(request));
    const db = serviceClient();
    const { data: changed, error } = await db.rpc("change_submission_status", { p_submission_id: id, p_status: input.status, p_public_note: input.publicNote, p_admin_note: input.adminNote, p_actor: admin.userId });
    if (error) throw error;
    if (!changed) throw new ApiError("未找到投递记录", 404);
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
