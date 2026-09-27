import { ApiError } from "./api";
import { authClient, serviceClient } from "./supabase";

export async function requireAdmin(request: Request): Promise<{ userId: string; role: "admin" }> {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new ApiError("请先登录管理员账号", 401);
  const { data: userData, error: authError } = await authClient().auth.getUser(token);
  if (authError || !userData.user) throw new ApiError("登录已失效，请重新登录", 401);
  const { data, error } = await serviceClient().from("admin_users").select("role").eq("user_id", userData.user.id).single();
  if (error || !data || data.role !== "admin") throw new ApiError("无权执行此操作", 403);
  return { userId: userData.user.id, role: "admin" };
}
