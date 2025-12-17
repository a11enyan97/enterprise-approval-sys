/**
 * 用户状态管理 Store (Zustand)
 * 重构版：不再依赖 localStorage，数据由服务端通过 Cookie 获取后注入
 */

import { create } from "zustand";

/**
 * 用户信息类型
 */
export interface UserInfo {
  id: number;
  username: string;
  realName: string;
  role: "applicant" | "approver";
  primaryDeptId?: number;
}

/**
 * 用户状态 Store
 */
interface UserStore {
  user: UserInfo | null;
  setUser: (user: UserInfo) => void;
  isApplicant: () => boolean;
  isApprover: () => boolean;
  getRoleLabel: (role: "applicant" | "approver") => string;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null, // 初始为空，将由 LayoutClient 接收服务端数据后立即初始化
  setUser: (user) => set({ user }),
  isApplicant: () => get().user?.role === "applicant",
  isApprover: () => get().user?.role === "approver",
  getRoleLabel: (role: "applicant" | "approver") => role === "applicant" ? "申请人" : "审批人",
}));
