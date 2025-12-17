"use client";

import { useRef } from "react";
import { useUserStore, type UserInfo } from "@/store/userStore";

/**
 * 状态初始化组件
 * 作用：接收服务端传来的用户信息，并在客户端首次渲染前注入到 Zustand Store
 */
export default function UserStoreInitializer({ user }: { user: UserInfo }) {
  // 使用 useRef 确保只初始化一次
  const initialized = useRef(false);
  
  if (!initialized.current) {
    // 直接更新 Store 状态，这会在组件渲染前发生
    useUserStore.setState({ user });
    initialized.current = true;
  }
  
  return null;
}

