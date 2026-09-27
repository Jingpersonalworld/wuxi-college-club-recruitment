"use client";
import { useState } from "react";
import type { UploadKind } from "@/lib/validation";
import { validateUpload } from "@/lib/validation";

export type SelectedFile = { id: string; kind: UploadKind; file: File };

export function UploadField({ kind, files, onChange, progress }: { kind: UploadKind; files: SelectedFile[]; onChange: (files: SelectedFile[]) => void; progress: Record<string, number> }) {
  const [error, setError] = useState("");
  const isResume = kind === "resume";
  const selected = files.filter((item) => item.kind === kind);
  const label = isResume ? "简历文件" : "作品文件";
  const accept = isResume ? ".pdf,application/pdf" : ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";
  function add(incoming: FileList | null) {
    if (!incoming) return;
    setError("");
    const next: SelectedFile[] = [];
    for (const file of Array.from(incoming)) {
      const issue = validateUpload(kind, file.name, file.type, file.size);
      if (issue) { setError(`${file.name}：${issue}`); continue; }
      next.push({ id: crypto.randomUUID(), kind, file });
    }
    const other = files.filter((item) => item.kind !== kind);
    if (!isResume && selected.length + next.length > 9) setError("作品文件最多上传 9 个");
    onChange([...other, ...(isResume ? next.slice(0, 1) : [...selected, ...next].slice(0, 9))]);
  }
  return <div className="field"><label>{label}{isResume ? " *" : ""}</label><div className="upload-box"><p style={{ margin: "0 0 8px" }}>{isResume ? "上传 PDF 简历" : "上传 PDF 或图片作品"}</p><p className="hint">{isResume ? "单文件最大 10 MB" : "单文件最大 5 MB，最多 9 个作品文件"}</p><input aria-label={label} type="file" accept={accept} multiple={!isResume} onChange={(event) => { add(event.target.files); event.target.value = ""; }} /></div>{error && <div role="alert" className="notice error-box">{error}</div>}{selected.map((item) => <div className="upload-row" key={item.id}><div style={{ flex: 1, minWidth: 0 }}><div style={{ wordBreak: "break-all" }}>{item.file.name}</div><div className="hint">{(item.file.size / 1024 / 1024).toFixed(2)} MB{progress[item.id] !== undefined ? ` · 上传 ${progress[item.id]}%` : ""}</div>{progress[item.id] !== undefined && <div className="progress-track"><span style={{ width: `${progress[item.id]}%` }} /></div>}</div><button type="button" className="button small ghost" onClick={() => onChange(files.filter((file) => file.id !== item.id))}>移除</button></div>)}</div>;
}
