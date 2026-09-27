import { NextResponse } from "next/server";
import { ApiError, errorResponse } from "@/lib/api";
import { serviceClient } from "@/lib/supabase";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const { data, error } = await serviceClient().from("projects")
      .select("id,name,slug,summary,description,requirements,start_at,deadline_at,status")
      .eq("slug", slug).eq("status", "published").single();
    if (error || !data) throw new ApiError("未找到该项目", 404);
    return NextResponse.json({ project: data });
  } catch (error) { return errorResponse(error); }
}
