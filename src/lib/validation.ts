import { z } from "zod";

const trimmed = (max: number) => z.string().trim().min(1, "此项为必填项").max(max, `不能超过 ${max} 字`);

export const applicantSchema = z.object({
  name: trimmed(40),
  studentId: z.string().trim().min(1, "请输入学号").max(40, "学号不能超过 40 字"),
  college: z.string().trim().min(1, "请输入学院").max(100, "学院不能超过 100 字"),
  className: z.string().trim().min(1, "请输入班级").max(80, "班级不能超过 80 字"),
  phone: z.string().trim().regex(/^1[3-9]\d{9}$/, "请输入有效的中国大陆手机号"),
  email: z.email("请输入有效的邮箱").max(120),
  school: trimmed(100),
  major: z.string().trim().max(100).default(""),
  grade: z.string().trim().max(50).default(""),
  introduction: z.string().trim().max(2000).default(""),
  motivation: z.string().trim().max(2000).default(""),
  portfolioUrl: z.union([z.url().startsWith("https://"), z.literal("")]).default(""),
  consent: z.literal(true, "请同意信息使用说明"),
});

export const projectSchema = z.object({
  name: trimmed(100),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "链接标识只允许小写字母、数字和连字符").max(80),
  summary: trimmed(300),
  description: trimmed(10000),
  requirements: z.string().trim().max(10000).default(""),
  startAt: z.iso.datetime({ offset: true }),
  deadlineAt: z.iso.datetime({ offset: true }),
  status: z.enum(["draft", "published", "closed", "archived"]).default("draft"),
}).refine((data) => new Date(data.deadlineAt) > new Date(data.startAt), {
  message: "截止时间必须晚于开始时间",
  path: ["deadlineAt"],
});

export const reviewSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().max(3000),
  reviewStatus: z.enum(["in_progress", "completed"]),
  decision: z.enum(["pass", "hold", "reject"]),
});

export const statusSchema = z.object({
  status: z.enum(["submitted", "screening", "reviewing", "passed", "pending", "rejected", "closed"]),
  publicNote: z.string().trim().max(1000).default(""),
  adminNote: z.string().trim().max(3000).default(""),
});

export type UploadKind = "resume" | "portfolio";

export function validateUpload(kind: UploadKind, fileName: string, mimeType: string, size: number): string | null {
  const allowed: Record<string, string[]> = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
  };
  if (kind === "resume" && mimeType !== "application/pdf") return "简历仅支持 PDF 文件";
  if (!allowed[mimeType]?.some((ext) => fileName.toLowerCase().endsWith(ext))) return "文件格式不受支持或扩展名不匹配";
  const limit = kind === "resume" ? 10 : 5;
  if (!Number.isInteger(size) || size <= 0 || size > limit * 1024 * 1024) return `文件必须小于或等于 ${limit} MB`;
  return null;
}
