import { getDepartmentCascaderOptions } from "@/services/departments.service";
import ApprovalLayoutClient from "../../components/business/approval/approval-layout-client";

export default async function ApprovalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 在 Server Component 中获取部门数据
  const departmentOptions = await getDepartmentCascaderOptions();

  return (
    <ApprovalLayoutClient 
      departmentOptions={departmentOptions}
    >
      {children}
    </ApprovalLayoutClient>
  );
}
