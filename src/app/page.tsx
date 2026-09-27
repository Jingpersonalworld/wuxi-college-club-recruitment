"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/PublicShell";
import { jsonFetch } from "@/lib/client-fetch";
import type { Project } from "@/lib/types";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    jsonFetch<{ projects: Project[] }>("/api/projects")
      .then((data) => setProjects(data.projects))
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  return <PublicShell><main>
    <section className="hero"><div className="shell">
      <span className="eyebrow">社团招新 · 作品征集</span>
      <h1>欢迎同学加入<br />无锡学院计算机协会</h1>
      <p className="lead">面向大一新生开放报名。了解招新方向，填写资料并提交简历或作品，之后可凭报名编号查询进度。</p>
      <div className="hero-actions"><Link href="/#projects" className="button">查看开放招新 →</Link><Link href="/status" className="button secondary">查询报名状态</Link></div>
    </div></section>
    <section id="projects" className="section"><div className="shell">
      <div className="section-head"><div><span className="eyebrow">开放项目</span><h2 style={{ margin: "12px 0 0" }}>当前开放招新</h2></div><p className="muted">选择感兴趣的方向，按页面提示完成报名。</p></div>
      {loading ? <div className="card empty">正在加载招新项目…</div> : error ? <div className="notice error-box">{error} <button className="button small secondary" onClick={() => location.reload()}>重试</button></div> : projects.length === 0 ? <div className="card empty">暂无开放招新项目，请稍后再来。</div> : <div className="grid">{projects.map((project) => <Link href={`/projects/${project.slug}`} className="card project-card" key={project.id}><span className="badge green" style={{ alignSelf: "start" }}>开放报名</span><h3>{project.name}</h3><p className="muted">{project.summary}</p><span className="meta">截止：{new Date(project.deadline_at).toLocaleString("zh-CN")}</span><span className="button secondary">查看招新详情 →</span></Link>)}</div>}
    </div></section>
    <section className="section" style={{ background: "#fff" }}><div className="shell"><span className="eyebrow">报名流程</span><h2 style={{ marginTop: 12 }}>四步完成报名</h2><div className="steps">{[["01", "了解招新", "阅读方向与截止时间"], ["02", "填写资料", "填写姓名、学号、学院和班级"], ["03", "上传文件", "提交简历和可选作品"], ["04", "追踪状态", "保存编号随时查询进度"]].map(([n, title, desc]) => <div key={n}><div className="step-number">{n}</div><h3>{title}</h3><p className="muted">{desc}</p></div>)}</div></div></section>
  </main></PublicShell>;
}
