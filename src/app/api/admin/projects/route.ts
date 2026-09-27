import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { errorResponse, readJson } from "@/lib/api";
import { serviceClient } from "@/lib/supabase";
import { projectSchema } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { data, error } = await serviceClient().from("projects").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ projects: data });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const input = projectSchema.parse(await readJson(request));
    const { data, error } = await serviceClient().from("projects").insert({
      name: input.name, slug: input.slug, summary: input.summary, description: input.description,
      requirements: input.requirements, start_at: input.startAt, deadline_at: input.deadlineAt,
      status: input.status, created_by: admin.userId,
    }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
