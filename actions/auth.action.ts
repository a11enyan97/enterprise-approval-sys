"use server";

import { cookies } from "next/headers";
import { type UserInfo } from "@/store/useUserStore";
import { getUserByRoleService } from "@/services/user.service";
import { isUserInfo } from "@/utils/guards";

const COOKIE_NAME = "app_user_info";

/**
 * 切换用户身份 (Server Action)
 * 设置 httpOnly Cookie
 */
export async function switchUserRoleAction(role: "applicant" | "approver") {
  // 从数据库获取真实用户
  const user = await getUserByRoleService(role);
  
  if (!user) {
    throw new Error(`找不到角色为 ${role} 的用户，请检查数据库`);
  }

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
 * 仅供 Server Component 使用，用于SSR渲染
 */
export async function getCurrentUserFromCookie(): Promise<UserInfo> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);

  if (cookie?.value) {
    try {
      const parsed = JSON.parse(cookie.value);
      if (isUserInfo(parsed)) {
        return parsed;
      }
      console.error("Cookie 数据格式无效", parsed);
    } catch (e) {
      console.error("Cookie 解析失败", e);
    }
  }
  
  // 默认返回申请人（兜底）
  const defaultUser = await getUserByRoleService("applicant");
  if (!defaultUser) {
     return {
        id: 0,
        username: "guest",
        realName: "访客",
        role: "applicant"
     };
  }
  return defaultUser;
}
