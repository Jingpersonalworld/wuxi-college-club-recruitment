"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { adminFetch } from "@/lib/admin-client";
import type { Project, Submission } from "@/lib/types";
import { statusLabels, statusTone } from "@/lib/types";

export default function AdminHome() {
  const [projects, setProjects] = useState<Project[]>([]); const [submissions, setSubmissions] = useState<Submission[]>([]); const [truncated, setTruncated] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([adminFetch<{ projects: Project[] }>("/api/admin/projects"), adminFetch<{ submissions: Submission[]; truncated: boolean }>("/api/admin/submissions")]).then(([a, b]) => { setProjects(a.projects); setSubmissions(b.submissions); setTruncated(b.truncated); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const pending = submissions.filter((s) => ["submitted", "screening", "reviewing"].includes(s.status)).length;
  const thisWeek = submissions.filter((s) => s.submitted_at && Date.now() - Date.parse(s.submitted_at) < 7 * 86400000).length;
  return <AdminShell><div className="admin-title"><div><p className="meta">DASHBOARD</p><h1>管理总览</h1></div><Link className="button" href="/admin/projects">新建招新项目 +</Link></div>{error && <div className="notice error-box">{error}</div>}{truncated && <div className="notice">报名超过 10000 条，统计仅覆盖最近记录。</div>}{loading ? <div className="card empty">正在加载统计数据…</div> : <><div className="stats">{[["开放项目", projects.filter((p) => p.status === "published").length], ["累计报名", truncated ? "10000+" : submissions.length], ["待处理", pending], ["近 7 天新增", thisWeek]].map(([label, value]) => <div className="card" key={label}><div className="muted">{label}</div><div className="stat-number">{value}</div></div>)}</div><div className="card" style={{ marginTop: 20 }}><div className="section-head"><h2 style={{ margin: 0 }}>最近报名</h2><Link href="/admin/submissions" className="button small secondary">查看全部</Link></div>{submissions.length === 0 ? <div className="empty">暂无报名记录。发布招新项目后，报名会显示在这里。</div> : <div className="table-wrap"><table className="data-table"><thead><tr><th>编号</th><th>姓名</th><th>学院 / 班级</th><th>状态</th><th>报名时间</th><th></th></tr></thead><tbody>{submissions.slice(0, 5).map((s) => <tr key={s.id}><td>{s.tracking_no}</td><td>{s.name}</td><td>{s.college || "—"}<div className="meta">{s.class_name || "班级未填写"}</div></td><td><span className={`badge ${statusTone(s.status)}`}>{statusLabels[s.status]}</span></td><td>{new Date(s.submitted_at).toLocaleDateString("zh-CN")}</td><td><Link href={`/admin/submissions/${s.id}`} className="button small secondary">查看</Link></td></tr>)}</tbody></table></div>}</div></>}</AdminShell>;
}
