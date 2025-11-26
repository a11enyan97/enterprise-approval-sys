/**
 * 用户状态管理 Store (Zustand)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
 * 测试用户数据（写死，用于开发测试）
 * TODO: 登录功能实现后，移除这些测试数据
 */
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
 * 获取初始用户（从 localStorage 或使用默认测试用户）
 */
const getInitialUser = (): UserInfo => {
  // 尝试从 localStorage 读取
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("user-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.state?.user) {
          return parsed.state.user;
        }
      } catch (e) {
        // 解析失败，使用默认用户
      }
    }
  }
  // 默认使用申请者角色（用于测试）
  return MOCK_USERS.applicant;
};

/**
 * 用户状态 Store
 */
interface UserStore {
  user: UserInfo;
  setUser: (user: UserInfo) => void;
  clearUser: () => void;
  switchToApplicant: () => void;
  switchToApprover: () => void;
  isApplicant: () => boolean;
  isApprover: () => boolean;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: getInitialUser(),
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: MOCK_USERS.applicant }),
      switchToApplicant: () => set({ user: MOCK_USERS.applicant }),
      switchToApprover: () => set({ user: MOCK_USERS.approver }),
      isApplicant: () => get().user?.role === "applicant",
      isApprover: () => get().user?.role === "approver",
    }),
    {
      name: "user-storage", // localStorage key
    }
  )
);

