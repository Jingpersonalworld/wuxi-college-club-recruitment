"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/PublicShell";
import { jsonFetch } from "@/lib/client-fetch";
import type { Project } from "@/lib/types";

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { jsonFetch<{ project: Project }>(`/api/projects/${slug}`).then((data) => setProject(data.project)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [slug]);
  const open = project && Date.now() >= Date.parse(project.start_at) && Date.now() <= Date.parse(project.deadline_at);
  return <PublicShell><main className="shell"><div className="page-head"><Link href="/" className="muted">← 返回首页</Link>{loading ? <h1>正在加载…</h1> : error ? <div className="notice error-box">{error}</div> : project && <><span className={`badge ${open ? "green" : "amber"}`} style={{ marginTop: 22 }}>{open ? "开放报名" : "当前不可报名"}</span><h1>{project.name}</h1><p className="lead">{project.summary}</p></>}</div>{project && <div className="two-col section" style={{ paddingTop: 12 }}><article className="card"><h2>招新介绍</h2><p className="prose">{project.description}</p><hr style={{ border: 0, borderTop: "1px solid #dbe9e2", margin: "30px 0" }} /><h2>报名要求</h2><p className="prose">{project.requirements || "请填写姓名、学号、学院和班级，并提交一份 PDF 简历，可附上作品文件或作品链接。"}</p></article><aside className="card"><h3>报名信息</h3><p className="muted">开始时间<br /><strong style={{ color: "var(--ink)" }}>{new Date(project.start_at).toLocaleString("zh-CN")}</strong></p><p className="muted">截止时间<br /><strong style={{ color: "var(--ink)" }}>{new Date(project.deadline_at).toLocaleString("zh-CN")}</strong></p><p className="hint">简历仅支持 PDF，最大 10 MB。作品支持 PDF、JPG、PNG、WebP，单个最大 5 MB。</p>{open ? <Link className="button" style={{ width: "100%" }} href={`/projects/${slug}/apply`}>立即报名 →</Link> : <button className="button" style={{ width: "100%" }} disabled>暂不可报名</button>}</aside></div>}</main></PublicShell>;
}
