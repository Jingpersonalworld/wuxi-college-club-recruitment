"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/PublicShell";

type Receipt = { trackingNo: string; queryCode: string; projectName: string; submittedAt: string };
export default function SuccessPage() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  useEffect(() => { const raw = sessionStorage.getItem("submission-receipt"); if (raw) { setReceipt(JSON.parse(raw)); sessionStorage.removeItem("submission-receipt"); } }, []);
  return <PublicShell><main className="form-wrap"><div className="form-card center"><div className="success-symbol">✓</div><h1 style={{ fontSize: 34, margin: "0 0 14px" }}>报名成功</h1>{receipt ? <><p className="muted">你的资料已提交至「{receipt.projectName}」。请保存以下信息，后续查询报名状态需要使用。</p><div className="credential"><div className="meta">报名编号</div>{receipt.trackingNo}</div><div className="credential"><div className="meta">查询密码</div>{receipt.queryCode}</div><p className="notice">查询密码只在本页显示一次，请立即复制保存。</p><div className="hero-actions" style={{ justifyContent: "center" }}><button className="button secondary" onClick={() => navigator.clipboard.writeText(`报名编号：${receipt.trackingNo}\n查询密码：${receipt.queryCode}`)}>复制查询信息</button><Link className="button" href="/status">查询报名状态</Link></div></> : <><p className="muted">报名凭证只在提交后显示一次。若已离开本页，请使用保存的报名编号和密码查询。</p><Link className="button" href="/">返回首页</Link></>}</div></main></PublicShell>;
}
