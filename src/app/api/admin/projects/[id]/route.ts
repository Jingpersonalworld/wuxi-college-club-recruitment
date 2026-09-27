import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ApiError, errorResponse, readJson } from "@/lib/api";
import { serviceClient } from "@/lib/supabase";
import { projectSchema } from "@/lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    z.uuid().parse(id);
    const input = projectSchema.parse(await readJson(request));
    const { data, error } = await serviceClient().from("projects").update({
      name: input.name, slug: input.slug, summary: input.summary, description: input.description,
      requirements: input.requirements, start_at: input.startAt, deadline_at: input.deadlineAt,
      status: input.status, updated_at: new Date().toISOString(),
    }).eq("id", id).select("*").single();
    if (error || !data) throw new ApiError("项目更新失败", 400);
    return NextResponse.json({ project: data });
  } catch (error) { return errorResponse(error); }
}
