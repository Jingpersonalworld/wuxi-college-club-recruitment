import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { collectPages } from "@/lib/pagination";
import { csvCell } from "@/lib/security";
import { serviceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const projectId = new URL(request.url).searchParams.get("projectId");
    let query = serviceClient().from("submissions").select("id,tracking_no,name,student_id,college,class_name,phone,email,school,major,grade,portfolio_url,status,submitted_at").neq("status", "draft").order("submitted_at", { ascending: false }).order("id", { ascending: true });
    if (projectId) query = query.eq("project_id", projectId);
    const { rows: data, truncated } = await collectPages(async (from, to) => {
      const { data, error } = await query.range(from, to);
      if (error) throw error;
      return data ?? [];
    });
    if (truncated) throw new ApiError("记录超过 10000 条，请先按项目筛选后导出", 413);
    const rows = [["投递编号", "姓名", "学号", "学院", "班级", "手机号", "邮箱", "学校或单位", "专业", "年级", "作品链接", "状态", "投递时间"], ...data.map((row) => [row.tracking_no, row.name, row.student_id, row.college, row.class_name, row.phone, row.email, row.school, row.major, row.grade, row.portfolio_url, row.status, row.submitted_at])];
    const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=submissions.csv", "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
