import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ApiError } from "./api";
import { createQueryCode, createTrackingNumber, hashQueryCode, verifyQueryCode } from "./security";
import { serviceClient } from "./supabase";
import { applicantSchema, validateUpload, type UploadKind } from "./validation";

const fileSchema = z.object({ kind: z.enum(["resume", "portfolio"]), name: z.string().min(1).max(255), mimeType: z.string(), size: z.number().int().positive() });
export const startSchema = z.object({ projectId: z.uuid(), applicant: applicantSchema, files: z.array(fileSchema).min(1).max(10) });

export async function startSubmission(input: z.infer<typeof startSchema>) {
  const parsed = startSchema.parse(input);
  if (parsed.files.filter((f) => f.kind === "resume").length !== 1) throw new ApiError("请上传一份 PDF 简历");
  for (const file of parsed.files) {
    const issue = validateUpload(file.kind, file.name, file.mimeType, file.size);
    if (issue) throw new ApiError(`${file.name}：${issue}`);
  }
  const db = serviceClient();
  const { data: project, error: projectError } = await db.from("projects").select("id,status,start_at,deadline_at").eq("id", parsed.projectId).single();
  if (projectError || !project || project.status !== "published" || Date.now() < Date.parse(project.start_at) || Date.now() > Date.parse(project.deadline_at)) throw new ApiError("此项目当前不接受投递", 409);
  const trackingNo = createTrackingNumber();
  const queryCode = createQueryCode();
  const applicant = parsed.applicant;
  const { data: submission, error: insertError } = await db.from("submissions").insert({
    project_id: project.id, tracking_no: trackingNo, query_token_hash: hashQueryCode(queryCode),
    name: applicant.name, student_id: applicant.studentId, college: applicant.college, class_name: applicant.className,
    phone: applicant.phone, email: applicant.email, school: applicant.school,
    major: applicant.major, grade: applicant.grade, introduction: applicant.introduction,
    motivation: applicant.motivation, portfolio_url: applicant.portfolioUrl || null,
    consent_at: new Date().toISOString(),
  }).select("id").single();
  if (insertError || !submission) throw insertError ?? new Error("创建投递失败");
  const signed: { id: string; kind: UploadKind; name: string; path: string; token: string; signedUrl: string }[] = [];
  for (const file of parsed.files) {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const path = `${project.id}/${submission.id}/${randomUUID()}${extension}`;
    const { data: fileRow, error: fileError } = await db.from("submission_files").insert({
      submission_id: submission.id, kind: file.kind, original_name: file.name,
      storage_path: path, mime_type: file.mimeType, file_size: file.size,
    }).select("id").single();
    if (fileError || !fileRow) throw fileError ?? new Error("创建文件记录失败");
    const { data: upload, error: signError } = await db.storage.from("submissions").createSignedUploadUrl(path);
    if (signError || !upload) throw signError ?? new Error("创建上传地址失败");
    signed.push({ id: fileRow.id, kind: file.kind, name: file.name, path, token: upload.token, signedUrl: upload.signedUrl });
  }
  return { submissionId: submission.id, trackingNo, queryCode, uploads: signed };
}

export async function finishSubmission(submissionId: string, trackingNo: string, queryCode: string) {
  const db = serviceClient();
  const { data: submission } = await db.from("submissions").select("id,status,query_token_hash,project_id").eq("id", submissionId).eq("tracking_no", trackingNo).single();
  if (!submission || !verifyQueryCode(queryCode, submission.query_token_hash)) throw new ApiError("投递验证失败", 403);
  if (submission.status !== "draft") throw new ApiError("这份投递已提交", 409);
  const { data: project } = await db.from("projects").select("deadline_at,status").eq("id", submission.project_id).single();
  if (!project || project.status !== "published" || Date.now() > Date.parse(project.deadline_at)) throw new ApiError("此项目已截止", 409);
  const { data: files, error: filesError } = await db.from("submission_files").select("id,kind,storage_path,file_size,mime_type,original_name").eq("submission_id", submissionId);
  if (filesError || !files?.some((f) => f.kind === "resume")) throw new ApiError("缺少简历文件", 409);
  for (const file of files) {
    const { data: info, error } = await db.storage.from("submissions").info(file.storage_path);
    if (error || !info || Number(info.size) !== file.file_size || info.contentType !== file.mime_type) throw new ApiError(`文件 ${file.original_name} 未成功上传或内容不匹配`, 409);
    await db.from("submission_files").update({ uploaded_at: new Date().toISOString() }).eq("id", file.id);
  }
  const { data: submitted, error: submitError } = await db.rpc("finish_submission", { p_submission_id: submissionId });
  if (submitError) throw submitError;
  if (!submitted) throw new ApiError("此项目已截止或投递已提交", 409);
  return { trackingNo, queryCode };
}
