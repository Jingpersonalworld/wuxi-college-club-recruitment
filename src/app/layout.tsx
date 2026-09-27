import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "无锡学院社团招新系统",
  description: "面向无锡学院同学的社团招新与作品征集报名平台",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
