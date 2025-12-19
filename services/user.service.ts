import { prisma } from "@/prisma/db";
import type { UserInfo } from "@/store/useUserStore";

/**
 * 获取所有用户列表
 */
export async function getAllUsersService() {
  const users = await prisma.user.findMany({
    orderBy: { id: 'asc' }
  });
  
  return users.map(u => ({
    id: u.id,
    username: u.username,
    realName: u.realName,
    role: u.role as "applicant" | "approver",
    primaryDeptId: u.primaryDeptId || undefined
  }));
}

/**
 * 根据角色获取第一个用户（用于模拟登录/切换身份）
 */
export async function getUserByRoleService(role: "applicant" | "approver") {
  const user = await prisma.user.findFirst({
    where: { role },
  });
  
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    realName: user.realName,
    role: user.role as "applicant" | "approver",
    primaryDeptId: user.primaryDeptId || undefined
  } as UserInfo;
}

/**
 * 菜单项定义
 */
export interface MenuItem {
  key: string;
  label: string;
  path: string;
}

const MENU_CONFIG: MenuItem[] = [
  { key: "approval", label: "审批", path: "/approval" },
  { key: "formBuilder", label: "表单配置", path: "/formBuilder" },
];

/**
 * 根据用户角色获取允许访问的菜单
 */
export function getMenusByRole(role: "applicant" | "approver"): MenuItem[] {
  // 1. 基础菜单（所有人可见）
  const allowedKeys: string[] = ["approval"];

  // 2. 审批人特权菜单
  if (role === "approver") {
    allowedKeys.push("formBuilder");
  }

  return MENU_CONFIG.filter(item => allowedKeys.includes(item.key));
}

