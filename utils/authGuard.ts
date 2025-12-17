"use client";

/**
 * 客户端 RBAC 辅助方法（轻量版）
 * - 仅做前端防呆：未登录或角色不符时给出错误提示并返回 false
 * - 真正的权限校验仍需后端/Server Action 再验证
 */

import { Message } from "@arco-design/web-react";

export type UserRole = "applicant" | "approver";

export interface AuthUser {
  id: number;
  username: string;
  realName: string;
  role: UserRole;
}

export function ensureLoggedIn(user: AuthUser | null | undefined, messageText = "请先登录"): boolean {
  if (!user) {
    Message.error(messageText);
    return false;
  }
  return true;
}

export function ensureRole(
  user: AuthUser | null | undefined,
  roles: UserRole[],
  onFailMsg = "当前账号无权限执行此操作"
): boolean {
  if (!user) {
    Message.error("请先登录");
    return false;
  }
  if (!roles.includes(user.role)) {
    Message.error(onFailMsg);
    return false;
  }
  return true;
}

