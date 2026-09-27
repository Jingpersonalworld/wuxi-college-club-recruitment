import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ApiError, errorResponse } from "@/lib/api";
import { serviceClient } from "@/lib/supabase";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(request);
    const { id } = await context.params;
    z.uuid().parse(id);
    const db = serviceClient();
    const { data: file } = await db.from("submission_files").select("storage_path,original_name,mime_type,uploaded_at").eq("id", id).single();
    if (!file?.uploaded_at) throw new ApiError("文件不存在或尚未上传", 404);
    const { data, error } = await db.storage.from("submissions").createSignedUrl(file.storage_path, 60, { download: new URL(request.url).searchParams.get("download") === "1" ? file.original_name : undefined });
    if (error || !data) throw error ?? new Error("无法创建文件预览地址");
    return NextResponse.json({ url: data.signedUrl, mimeType: file.mime_type, name: file.original_name });
  } catch (error) { return errorResponse(error); }
}
