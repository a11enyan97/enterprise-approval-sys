"use server";

import { cookies } from "next/headers";
import { type UserInfo } from "@/store/userStore";

const COOKIE_NAME = "app_user_info";

// 模拟用户数据（与 Store 中保持一致，未来可对接数据库）
const MOCK_USERS: Record<string, UserInfo> = {
  applicant: {
    id: 5,
    username: "applicant001",
    realName: "张三",
    role: "applicant",
    primaryDeptId: 1,
  },
  approver: {
    id: 6,
    username: "approver001",
    realName: "李四",
    role: "approver",
    primaryDeptId: 2,
  },
};

/**
 * 切换用户身份 (Server Action)
 * 设置 httpOnly Cookie
 */
export async function switchUserRoleAction(role: "applicant" | "approver") {
  const user = MOCK_USERS[role];
  const cookieStore = await cookies();
  
  // 生产环境建议存储 Token，这里为了演示直接存储用户信息 JSON
  cookieStore.set(COOKIE_NAME, JSON.stringify(user), {
    httpOnly: true, // 前端 JS 无法读取，更安全
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7天
    sameSite: "lax",
  });

  return user;
}

/**
 * 获取当前用户 (Server Side Helper)
 * 仅供 Server Component 使用
 */
export async function getCurrentUserFromCookie(): Promise<UserInfo> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  
  if (cookie?.value) {
    try {
      return JSON.parse(cookie.value) as UserInfo;
    } catch (e) {
      console.error("Cookie 解析失败", e);
    }
  }
  // 默认返回申请人（兜底）
  return MOCK_USERS.applicant;
}

