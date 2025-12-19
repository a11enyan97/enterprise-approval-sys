"use client";

import { useMemo, useState, useEffect } from "react";
import { Layout, Menu, Avatar, Dropdown } from "@arco-design/web-react";
import { IconCaretDown } from "@arco-design/web-react/icon";
import { useUserStore, type UserStore, type UserInfo } from "@/store/useUserStore";
import { useRouter, usePathname } from "next/navigation";
import { USER_ROLE_OPTIONS } from "@/constants/approvalConfig";
import { switchUserRoleAction } from "@/actions/auth.action";
import { getCurrentUserMenusAction } from "@/actions/user.action";
import type { MenuItem } from "@/services/user.service";

const { Header, Sider, Content } = Layout;

export default function AppLayoutClient({
  children,
  user: initialUser,
  menus: initialMenus,
}: {
  children: React.ReactNode;
  user: UserInfo;
  menus: MenuItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const storeUser = useUserStore((state: UserStore) => state.user);
  const setUser = useUserStore((state: UserStore) => state.setUser);
  
  // 优先使用 store 中的用户状态（客户端更新后），否则使用初始传入的 props（服务端渲染/首屏）
  const currentUser = storeUser || initialUser;
  const isApplicant = currentUser?.role === "applicant";

  const [menus, setMenus] = useState<MenuItem[]>(initialMenus);

  // 监听用户角色变化，重新获取菜单权限
  useEffect(() => {
    if (currentUser?.role) {
      getCurrentUserMenusAction().then(fetchedMenus => {
         setMenus(fetchedMenus);
      });
    }
  }, [currentUser?.role]);

  // 根据当前路径计算选中的菜单项
  const selectedKeys = useMemo(() => {
    const currentMenu = menus.find(m => pathname?.startsWith(m.path));
    return currentMenu ? [currentMenu.key] : [];
  }, [pathname, menus]);

  // 身份切换处理
  const handleRoleChange = async (roleValue: string) => {
    // 1. 服务端设置 Cookie
    const newUser = await switchUserRoleAction(roleValue as "applicant" | "approver");
    // 2. 客户端更新 Store
    setUser(newUser);
  };

  const dropList = (
    <Menu>
      {USER_ROLE_OPTIONS.map((role) => (
        <Menu.Item
          key={role.value}
          onClick={() => handleRoleChange(role.value)}
          style={{
            backgroundColor: currentUser?.role === role.value ? "#e6f4ff" : "transparent",
            color: currentUser?.role === role.value ? "#1890ff" : "#000",
          }}
        >
          {role.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  // 菜单点击处理
  const handleMenuClick = (key: string) => {
    const targetMenu = menus.find(m => m.key === key);
    if (targetMenu) {
      router.push(targetMenu.path);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          backgroundColor: "#fff",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937" }}>
          企业审批系统
        </div>
        <Dropdown droplist={dropList} position="br" trigger="click">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: "4px",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Avatar size={32} style={{ backgroundColor: "#3370ff" }}>
              {currentUser?.realName?.charAt(0) || "用"}
            </Avatar>
            <span style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>
              {currentUser?.realName || "用户"} ({isApplicant ? "申请人" : "审批人"})
              <IconCaretDown
                style={{ marginLeft: "4px", display: "inline-block" }}
              />
            </span>
          </div>
        </Dropdown>
      </Header>
      <Layout>
        <Sider
          width={200}
          style={{
            backgroundColor: "#fff",
            borderRight: "1px solid #e5e7eb",
          }}
        >
          <Menu
            selectedKeys={selectedKeys}
            onClickMenuItem={handleMenuClick}
            style={{ border: "none", height: "100%" }}
          >
            {menus.map(menu => (
              <Menu.Item key={menu.key}>{menu.label}</Menu.Item>
            ))}
          </Menu>
        </Sider>
        <Content
          style={{
            backgroundColor: "#f9fafb",
            padding: "24px",
            overflow: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

