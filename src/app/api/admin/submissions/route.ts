import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { collectPages } from "@/lib/pagination";
import { serviceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const status = url.searchParams.get("status");
    let query = serviceClient().from("submissions")
      .select("id,project_id,tracking_no,name,student_id,college,class_name,phone,email,school,status,submitted_at,updated_at")
      .neq("status", "draft").order("submitted_at", { ascending: false }).order("id", { ascending: true });
    if (projectId) query = query.eq("project_id", projectId);
    if (status) query = query.eq("status", status);
    const { rows, truncated } = await collectPages(async (from, to) => {
      const { data, error } = await query.range(from, to);
      if (error) throw error;
      return data ?? [];
    });
    const search = url.searchParams.get("search")?.trim().toLowerCase();
    const filtered = search ? rows.filter((row) => [row.tracking_no, row.name, row.student_id, row.college, row.class_name, row.phone, row.email, row.school].some((value) => String(value).toLowerCase().includes(search))) : rows;
    return NextResponse.json({ submissions: filtered, truncated });
  } catch (error) { return errorResponse(error); }
}
