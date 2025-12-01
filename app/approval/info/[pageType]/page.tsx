import { notFound, redirect } from "next/navigation";
import { getApprovalRequestById } from "@/services/approval.service";
import { getDepartmentCascaderOptions } from "@/services/departments.service";
import ApprovalDetailClient from "../../../../components/business/approval/approval-detail-client";

interface ApprovalDetailPageProps {
  params: Promise<{ pageType: string }>;
  searchParams: Promise<{ id?: string }>;
}

export default async function ApprovalDetailPage({
  params,
  searchParams,
}: ApprovalDetailPageProps) {
  const { pageType } = await params;
  const { id } = await searchParams;

  // 验证 pageType
  const validPageTypes = ["add", "details", "edit"];
  if (!validPageTypes.includes(pageType)) {
    notFound();
  }

  const isDetailsOrEdit = pageType === "details" || pageType === "edit";

  // 如果是详情页或编辑页，必须提供 id
  if (isDetailsOrEdit && !id) {
    redirect("/approval");
  }

  // 在 Server Component 中获取数据
  const [approvalDetail, departmentOptions] = await Promise.all([
    isDetailsOrEdit && id
      ? getApprovalRequestById(BigInt(id))
      : Promise.resolve(null),
    getDepartmentCascaderOptions(),
  ]);

  // 如果是详情页或编辑页但数据不存在，返回 404
  if (isDetailsOrEdit && !approvalDetail) {
    notFound();
  }

  return (
    <ApprovalDetailClient
      pageType={pageType}
      approvalDetail={approvalDetail}
      departmentOptions={departmentOptions}
      requestId={id}
    />
  );
}
