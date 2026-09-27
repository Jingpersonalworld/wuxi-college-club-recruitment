import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(error: unknown, status = 500) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "请检查输入内容", details: error.flatten().fieldErrors }, { status: 400 });
  }
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && error.message.startsWith("缺少 Supabase")) {
    return NextResponse.json({ error: "服务尚未完成 Supabase 配置，请联系管理员" }, { status: 503 });
  }
  console.error(error);
  return NextResponse.json({ error: "服务器暂时无法处理请求，请稍后重试" }, { status });
}

export class ApiError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); }
  catch { throw new ApiError("请求内容不是有效 JSON", 400); }
}
