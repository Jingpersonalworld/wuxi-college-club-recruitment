import Link from "next/link";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return <><header className="topbar"><div className="shell"><Link href="/" className="brand"><span className="brand-mark" /> 无锡学院社团招新系统</Link><nav className="nav"><Link href="/#projects">开放招新</Link><Link href="/status">报名状态</Link><Link href="/admin/login">管理员入口</Link></nav></div></header>{children}<footer className="footer"><div className="shell">© {new Date().getFullYear()} 无锡学院社团招新系统 · 清晰报名，认真评审</div></footer></>;
}
