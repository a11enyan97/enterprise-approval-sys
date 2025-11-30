import type { Metadata } from "next";
import "./globals.css";
import AppLayoutClient from "@/components/common/layout-client";

export const metadata: Metadata = {
  title: "企业审批系统",
  description: "字节前端训练营大作业",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppLayoutClient>{children}</AppLayoutClient>
      </body>
    </html>
  );
}
