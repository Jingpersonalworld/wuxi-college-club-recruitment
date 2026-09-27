import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateUpload, applicantSchema, projectSchema } from "./validation.ts";

describe("applicant data", () => {
  it("rejects an invalid phone number", () => {
    assert.equal(applicantSchema.safeParse({ name: "测试同学", studentId: "20260001", college: "计算机学院", className: "计科2601", phone: "123", email: "demo@example.com", school: "示例大学", consent: true }).success, false);
  });
  it("accepts fictional complete contact data", () => {
    assert.equal(applicantSchema.safeParse({ name: "测试同学", studentId: "20260001", college: "计算机学院", className: "计科2601", phone: "13800000000", email: "demo@example.com", school: "示例大学", consent: true }).success, true);
  });
  it("requires student identity fields with their own meanings", () => {
    const result = applicantSchema.safeParse({ name: "测试同学", phone: "13800000000", email: "demo@example.com", school: "示例大学", consent: true });
    assert.equal(result.success, false);
    assert.deepEqual(result.error.issues.map((issue) => issue.path[0]), ["studentId", "college", "className"]);
  });
});

describe("project data", () => {
  it("rejects a deadline before its start", () => {
    assert.equal(projectSchema.safeParse({ name: "示例项目", slug: "demo-project", summary: "这是示例项目说明", description: "这是一段示例项目的详细说明。", startAt: "2026-10-10T00:00:00+08:00", deadlineAt: "2026-10-01T00:00:00+08:00" }).success, false);
  });
});

describe("upload rules", () => {
  it("allows a 10 MB PDF resume", () => assert.equal(validateUpload("resume", "resume.pdf", "application/pdf", 10 * 1024 * 1024), null));
  it("rejects oversized resumes", () => assert.match(validateUpload("resume", "resume.pdf", "application/pdf", 10 * 1024 * 1024 + 1), /10 MB/));
  it("rejects mismatched extensions", () => assert.notEqual(validateUpload("resume", "resume.exe", "application/pdf", 1024), null));
  it("rejects unsupported work files", () => assert.notEqual(validateUpload("portfolio", "work.zip", "application/zip", 1024), null));
});
