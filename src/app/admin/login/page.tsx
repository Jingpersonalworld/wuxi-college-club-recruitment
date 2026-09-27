"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PublicShell } from "@/components/PublicShell";
import { adminFetch } from "@/lib/admin-client";
import { browserClient } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function login(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(""); let client: ReturnType<typeof browserClient> | null = null; try { client = browserClient(); const { error: authError } = await client.auth.signInWithPassword({ email, password }); if (authError) throw new Error("邮箱或密码不正确"); await adminFetch("/api/admin/me"); router.push("/admin"); } catch (cause) { if (client) await client.auth.signOut(); setError(cause instanceof Error ? cause.message : "登录失败"); } finally { setLoading(false); } }
  return <PublicShell><main className="form-wrap" style={{ maxWidth: 460 }}><div className="page-head"><span className="eyebrow">ADMIN PORTAL</span><h1>管理员登录</h1><p className="muted">使用已授权的管理账号进入社团招新工作台。</p></div><form className="form-card" onSubmit={login}><div className="field"><label htmlFor="email">邮箱</label><input id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></div><div className="field"><label htmlFor="password">密码</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>{error && <div role="alert" className="notice error-box">{error}</div>}<button className="button" style={{ width: "100%" }} disabled={loading}>{loading ? "登录中…" : "登录工作台"}</button><p className="hint" style={{ marginTop: 18 }}>管理员账号由系统负责人在 Supabase 控制台创建。</p></form><p style={{ textAlign: "center", marginTop: 18 }}><Link href="/" className="muted">← 返回公开页面</Link></p></main></PublicShell>;
}
