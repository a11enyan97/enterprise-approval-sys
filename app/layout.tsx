import type { Metadata } from "next";
import "./globals.css";
import AppLayoutClient from "@/components/common/LayoutClient";
import { getCurrentUserFromCookie } from "@/actions/auth.action";
import UserStoreInitializer from "@/components/common/UserStoreInitializer";

export const metadata: Metadata = {
  title: "企业审批系统",
  description: "字节前端训练营大作业",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 从服务端中获取用户信息
  const user = await getCurrentUserFromCookie();

  return (
    <html lang="en">
      <body className="antialiased">
        <UserStoreInitializer user={user} />
        <AppLayoutClient user={user}>{children}</AppLayoutClient>
      </body>
    </html>
  );
}
