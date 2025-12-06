import { getApprovalRequestList } from "@/services/approval.service";
import { getDepartmentCascaderOptions } from "@/services/departments.service";
import ApprovalFilterClient from "@/components/business/approval/ApprovalFilterClient";
import ApprovalTableClient from "@/components/business/approval/ApprovalTableClient";

import type { GetApprovalListParams } from "@/types/approval";

interface ApprovalPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    deptId?: string;
    projectName?: string;
    createTimeStart?: string;
    createTimeEnd?: string;
    approvalTimeStart?: string;
    approvalTimeEnd?: string;
  }>;
}

export default async function ApprovalPage({ searchParams }: ApprovalPageProps) {
  const params = await searchParams;

  // 解析查询参数
  const page = params.page ? parseInt(params.page) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 10;

  const queryOptions: GetApprovalListParams = {
    page,
    pageSize,
    status: params.status,
    deptId: params.deptId ? parseInt(params.deptId) : undefined,
    projectName: params.projectName,
    createTimeStart: params.createTimeStart,
    createTimeEnd: params.createTimeEnd,
    approvalTimeStart: params.approvalTimeStart,
    approvalTimeEnd: params.approvalTimeEnd,
  };

  // 在 Server Component 中获取数据
  const approvalData = await getApprovalRequestList(queryOptions);
  // 在 Server Component 中获取部门数据
  const departmentOptions = await getDepartmentCascaderOptions();

  return (
    <>
      <ApprovalFilterClient 
        departmentOptions={departmentOptions}
      />
      <ApprovalTableClient
        initialData={approvalData}
        initialPage={page}
        initialPageSize={pageSize}
      />
    </>
  );
}
