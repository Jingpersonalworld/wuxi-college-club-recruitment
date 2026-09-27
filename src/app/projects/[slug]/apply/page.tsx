"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/PublicShell";
import { UploadField, type SelectedFile } from "@/components/UploadField";
import { jsonFetch } from "@/lib/client-fetch";
import type { Project } from "@/lib/types";
import { applicantSchema } from "@/lib/validation";

type Form = { name: string; studentId: string; college: string; className: string; phone: string; email: string; school: string; major: string; grade: string; introduction: string; motivation: string; portfolioUrl: string; consent: boolean };
const initial: Form = { name: "", studentId: "", college: "", className: "", phone: "", email: "", school: "无锡学院", major: "", grade: "大一", introduction: "", motivation: "", portfolioUrl: "", consent: false };
type StartResult = { submissionId: string; trackingNo: string; queryCode: string; uploads: { id: string; name: string; path: string; signedUrl: string; token: string }[] };

function uploadWithProgress(url: string, file: File, onProgress: (value: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
    xhr.setRequestHeader("Authorization", `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`文件上传失败（${xhr.status}）`));
    xhr.onerror = () => reject(new Error("网络中断，请检查连接后重试"));
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    xhr.send(body);
  });
}

export default function ApplyPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initial);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { jsonFetch<{ project: Project }>(`/api/projects/${slug}`).then((data) => setProject(data.project)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [slug]);
  function update<K extends keyof Form>(key: K, value: Form[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function next() {
    setError("");
    if (step === 0) {
      const result = applicantSchema.pick({ name: true, studentId: true, college: true, className: true, phone: true, email: true, school: true, major: true, grade: true }).safeParse(form);
      if (!result.success) { setError(result.error.issues[0].message); return; }
    }
    if (step === 1) {
      const result = applicantSchema.safeParse({ ...form, consent: true });
      if (!result.success) { setError(result.error.issues[0].message); return; }
    }
    if (step === 2 && files.filter((file) => file.kind === "resume").length !== 1) { setError("请上传一份 PDF 简历"); return; }
    setStep((value) => Math.min(value + 1, 3));
  }
  async function submit() {
    if (!project) return;
    const check = applicantSchema.safeParse(form);
    if (!check.success) { setError(check.error.issues[0].message); return; }
    if (files.filter((file) => file.kind === "resume").length !== 1) { setError("请上传一份 PDF 简历"); return; }
    setBusy(true); setError(""); setProgress({});
    try {
      const start = await jsonFetch<StartResult>("/api/submissions/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: project.id, applicant: form, files: files.map((item) => ({ kind: item.kind, name: item.file.name, mimeType: item.file.type, size: item.file.size })) }) });
      for (let i = 0; i < files.length; i++) {
        const upload = start.uploads[i];
        await uploadWithProgress(upload.signedUrl, files[i].file, (value) => setProgress((current) => ({ ...current, [files[i].id]: value })));
        setProgress((current) => ({ ...current, [files[i].id]: 100 }));
      }
      await jsonFetch("/api/submissions/finish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId: start.submissionId, trackingNo: start.trackingNo, queryCode: start.queryCode }) });
      sessionStorage.setItem("submission-receipt", JSON.stringify({ trackingNo: start.trackingNo, queryCode: start.queryCode, projectName: project.name, submittedAt: new Date().toISOString() }));
      router.push("/apply/success");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "提交失败，请重试"); }
    finally { setBusy(false); }
  }
  const field = (key: keyof Form, label: string, required = false) => <div className="field"><label htmlFor={key}>{label}{required ? " *" : ""}</label><input id={key} value={String(form[key])} onChange={(event) => update(key, event.target.value as never)} /></div>;
  const canApply = project && Date.now() >= Date.parse(project.start_at) && Date.now() <= Date.parse(project.deadline_at);
  return <PublicShell><main className="form-wrap"><Link href={`/projects/${slug}`} className="muted">← 返回项目介绍</Link><div className="page-head" style={{ paddingBottom: 0 }}><span className="eyebrow">CLUB APPLICATION</span><h1>{loading ? "正在加载…" : project ? `报名 · ${project.name}` : "项目不可用"}</h1><p className="muted">按照步骤填写信息，带 * 的项目为必填。</p></div>{project && !canApply && <div className="notice error-box">项目当前不在报名时间内。</div>}{canApply && <><div className="progress-steps" aria-label={`第 ${step + 1} 步，共 4 步`}>{[0, 1, 2, 3].map((n) => <span key={n} className={n <= step ? "active" : ""} />)}</div><div className="form-card"><div className="meta">第 {step + 1} 步 / 共 4 步</div><h2 style={{ marginTop: 8 }}>{["基本信息", "个人介绍", "上传文件", "确认提交"][step]}</h2>{step === 0 && <div className="form-grid">{field("name", "姓名", true)}{field("studentId", "学号", true)}{field("college", "学院", true)}{field("className", "班级", true)}{field("phone", "手机号", true)}{field("email", "邮箱", true)}{field("school", "学校", true)}{field("major", "专业或方向")}{field("grade", "年级")}</div>}{step === 1 && <><div className="field"><label htmlFor="introduction">个人介绍</label><textarea id="introduction" value={form.introduction} onChange={(e) => update("introduction", e.target.value)} maxLength={2000} /></div><div className="field"><label htmlFor="motivation">报名动机</label><textarea id="motivation" value={form.motivation} onChange={(e) => update("motivation", e.target.value)} maxLength={2000} /></div><div className="field"><label htmlFor="portfolioUrl">作品链接（HTTPS）</label><input id="portfolioUrl" type="url" placeholder="https://example.com/portfolio" value={form.portfolioUrl} onChange={(e) => update("portfolioUrl", e.target.value)} /><span className="hint">可以填写作品网站、在线演示或代码仓库链接。</span></div></>}{step === 2 && <><UploadField kind="resume" files={files} onChange={setFiles} progress={progress} /><UploadField kind="portfolio" files={files} onChange={setFiles} progress={progress} /></>}{step === 3 && <><dl className="detail-list"><dt>姓名</dt><dd>{form.name}</dd><dt>学号</dt><dd>{form.studentId}</dd><dt>学院</dt><dd>{form.college}</dd><dt>班级</dt><dd>{form.className}</dd><dt>手机号</dt><dd>{form.phone}</dd><dt>邮箱</dt><dd>{form.email}</dd><dt>学校</dt><dd>{form.school}</dd><dt>作品链接</dt><dd>{form.portfolioUrl || "未填写"}</dd><dt>文件</dt><dd>{files.map((item) => item.file.name).join("、")}</dd></dl><label style={{ display: "flex", gap: 10, alignItems: "start", marginTop: 20 }}><input type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} style={{ marginTop: 5 }} /><span>我确认提交的信息真实，并同意项目管理方仅为本项目评审使用这些资料。 *</span></label><p className="hint">请保存提交成功页的报名编号和查询密码，用于后续状态查询。</p></>}{error && <div role="alert" className="notice error-box">{error}</div>}<div className="actions">{step > 0 ? <button type="button" className="button ghost" onClick={() => { setError(""); setStep((n) => n - 1); }} disabled={busy}>上一步</button> : <span />}{step < 3 ? <button type="button" className="button" onClick={next}>下一步 →</button> : <button type="button" className="button" onClick={submit} disabled={busy}>{busy ? "正在上传并提交…" : "确认报名"}</button>}</div></div></>}{loading && <div className="card empty">正在加载项目…</div>}</main></PublicShell>;
}
