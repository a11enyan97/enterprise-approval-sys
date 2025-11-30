"use client";

import { useSearchParams } from "next/navigation";
import ApprovalFilterClient from "./approval-filter-client";
import type { CascaderOption } from "@/types/departments";

interface ApprovalLayoutClientProps {
  children: React.ReactNode;
  departmentOptions: CascaderOption[];
}

export default function ApprovalLayoutClient({
  children,
  departmentOptions,
}: ApprovalLayoutClientProps) {
  const searchParams = useSearchParams();
  
  // 从 URL 获取筛选参数
  const filterParams = {
    status: searchParams.get("status") || undefined,
    deptLevel1Id: searchParams.get("deptLevel1Id") || undefined,
    deptLevel2Id: searchParams.get("deptLevel2Id") || undefined,
    deptLevel3Id: searchParams.get("deptLevel3Id") || undefined,
    approvalProject: searchParams.get("approvalProject") || undefined,
  };

  return (
    <div className="p-6 bg-zinc-50 min-h-screen">
      {/* 筛选区 */}
      <ApprovalFilterClient 
        initialValues={filterParams}
        departmentOptions={departmentOptions}
      />
      {/* 表格区 */}
      <div className="bg-white rounded-md p-4">
        {children}
      </div>
    </div>
  );
}

