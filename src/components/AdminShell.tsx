"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { browserClient } from "@/lib/supabase";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => { adminFetch("/api/admin/me").then(() => setReady(true)).catch(() => router.replace("/admin/login")); }, [router]);
  if (!ready) return <div className="shell section muted">正在验证管理员身份…</div>;
  return <div className="admin-layout"><aside className="sidebar"><Link href="/admin" className="brand"><span className="brand-mark" /> 社团招新管理</Link><nav className="side-nav"><Link className={`side-link ${pathname === "/admin" ? "active" : ""}`} href="/admin">总览</Link><Link className={`side-link ${pathname.startsWith("/admin/projects") ? "active" : ""}`} href="/admin/projects">招新项目</Link><Link className={`side-link ${pathname.startsWith("/admin/submissions") ? "active" : ""}`} href="/admin/submissions">报名记录</Link><button className="side-link" style={{ border: 0, background: "none", textAlign: "left" }} onClick={async () => { await browserClient().auth.signOut(); router.push("/admin/login"); }}>退出登录</button></nav></aside><main className="admin-main">{children}</main></div>;
}
