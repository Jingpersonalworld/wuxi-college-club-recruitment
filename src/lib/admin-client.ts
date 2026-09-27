import { browserClient } from "./supabase";

export async function adminFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const { data } = await browserClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("请先登录管理员账号");
  const response = await fetch(url, { ...options, headers: { ...options?.headers, Authorization: `Bearer ${token}` } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `请求失败（${response.status}）`);
  return body as T;
}

export async function adminDownload(url: string): Promise<void> {
  const { data } = await browserClient().auth.getSession();
  if (!data.session) throw new Error("请先登录管理员账号");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${data.session.access_token}` } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || "导出失败"); }
  const href = URL.createObjectURL(await response.blob());
  const link = document.createElement("a"); link.href = href; link.download = "社团招新报名记录.csv"; link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
