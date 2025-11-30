"use client";

import { Layout, Menu, Avatar, Dropdown } from "@arco-design/web-react";
import { IconCaretDown } from "@arco-design/web-react/icon";
import { useUserStore } from "@/store/userStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const { Header, Sider, Content } = Layout;

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isApplicant, switchToApplicant, switchToApprover } = useUserStore();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // 根据当前路径设置选中的菜单项
  useEffect(() => {
    if (pathname?.startsWith("/approval")) {
      setSelectedKeys(["approval"]);
    }
  }, [pathname]);

  // 身份切换处理
  const handleRoleChange = (roleValue: string) => {
    if (roleValue === "applicant") {
      switchToApplicant();
    } else if (roleValue === "approver") {
      switchToApprover();
    }
  };

  // 下拉菜单
  const roles = [
    { label: "申请人", value: "applicant" },
    { label: "审批人", value: "approver" },
  ];

  const dropList = (
    <Menu>
      {roles.map((role) => (
        <Menu.Item
          key={role.value}
          onClick={() => handleRoleChange(role.value)}
          style={{
            backgroundColor: user?.role === role.value ? "#e6f4ff" : "transparent",
            color: user?.role === role.value ? "#1890ff" : "#000",
          }}
        >
          {role.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  // 菜单点击处理
  const handleMenuClick = (key: string) => {
    if (key === "approval") {
      router.push("/approval");
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
              {user?.realName?.charAt(0) || "用"}
            </Avatar>
            <span style={{ fontSize: "14px", color: "#374151", fontWeight: 500 }}>
              {user?.realName || "用户"} ({isApplicant() ? "申请人" : "审批人"})
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
            <Menu.Item key="approval">审批</Menu.Item>
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

