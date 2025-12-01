import { getApprovalRequestList } from "@/services/approval.service";
import ApprovalTableClient from "@/components/business/approval/approval-table-client";

interface ApprovalPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    deptLevel1Id?: string;
    deptLevel2Id?: string;
    deptLevel3Id?: string;
    approvalProject?: string;
  }>;
}

export default async function ApprovalPage({ searchParams }: ApprovalPageProps) {
  const params = await searchParams;
  
  // 解析查询参数
  const page = params.page ? parseInt(params.page) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 10;
  
  const queryOptions = {
    page,
    pageSize,
    status: params.status,
    deptLevel1Id: params.deptLevel1Id ? parseInt(params.deptLevel1Id) : undefined,
    deptLevel2Id: params.deptLevel2Id ? parseInt(params.deptLevel2Id) : undefined,
    deptLevel3Id: params.deptLevel3Id ? parseInt(params.deptLevel3Id) : undefined,
  };

  // 在 Server Component 中获取数据
  const approvalData = await getApprovalRequestList(queryOptions);

  return (
    <ApprovalTableClient 
      initialData={approvalData}
      initialPage={page}
      initialPageSize={pageSize}
    />
  );
}
