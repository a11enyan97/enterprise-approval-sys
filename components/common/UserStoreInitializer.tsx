"use client";

import { useRef } from "react";
import { userStoreRaw, type UserInfo } from "@/store/useUserStore";

/**
 * 状态初始化组件
 * 作用：接收服务端传来的用户信息，并在客户端首次渲染前注入到 Zustand Store
 */
export default function UserStoreInitializer({ user }: { user: UserInfo }) {
  // 使用 useRef 确保只初始化一次（符合 React 推荐的 ref 初始化模式）
  const initialized = useRef<boolean | null>(null);
  if (initialized.current === null) {
    initialized.current = true;
    userStoreRaw.setState({ user });
  }
  
  return null;
}

