"use server";

import { getAllUsersService, getMenusByRole } from "@/services/user.service";
import { getCurrentUserFromCookie } from "@/actions/auth.action";

/**
 * 获取用户列表
 */
export async function getUsersAction() {
  try {
    const users = await getAllUsersService();
    return { success: true, data: users };
  } catch (error) {
    console.error("Fetch users failed:", error);
    return { success: false, error: "获取用户列表失败" };
  }
}

/**
 * 获取当前登录用户的菜单配置
 */
export async function getCurrentUserMenusAction() {
  const user = await getCurrentUserFromCookie();
  const menus = getMenusByRole(user.role);
  return menus;
}

