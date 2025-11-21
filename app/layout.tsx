import type { Metadata } from "next";
import "./globals.css";

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
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
