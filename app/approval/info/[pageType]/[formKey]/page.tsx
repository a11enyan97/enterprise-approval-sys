import { notFound, redirect } from "next/navigation";
import { getApprovalRequestById } from "@/services/approval.service";
import { getDepartmentCascaderOptions } from "@/services/departments.service";
import { getFormTemplateByKeyAction } from "@/actions/form.action";
import { getApprovalFormSchemaAction } from "@/actions/approval.action";
import type { FormSchema } from "@/types/form";
import ApprovalDetailClient from "@/components/business/approval/ApprovalDetailClient";

interface ApprovalDetailPageProps {
  params: Promise<{ pageType: string; formKey?: string }>;
  searchParams: Promise<{ id?: string }>;
}

export default async function ApprovalDetailPage({
  params,
  searchParams,
}: ApprovalDetailPageProps) {
  const { pageType, formKey } = await params;
  const { id } = await searchParams;

  // 验证 pageType
  const validPageTypes = ["add", "details", "edit"];
  if (!validPageTypes.includes(pageType)) {
    notFound();
  }

    // 如果是详情页或编辑页，必须提供 id
  const isDetailsOrEdit = pageType === "details" || pageType === "edit";
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

  // 获取表单 schema：优先 formKey 查模板，失败或缺失时用默认
  let initialSchema: FormSchema | null = null;
  if (formKey) {
    const res = await getFormTemplateByKeyAction(formKey);
    if (res.success && res.data?.schema) {
      initialSchema = res.data.schema as FormSchema;
    }
  }
  if (!initialSchema) {
    const fallback = await getApprovalFormSchemaAction("approval.create");
    if (!fallback.success || !fallback.data) {
      throw new Error(fallback.error || "表单配置获取失败");
    }
    initialSchema = fallback.data;
  }

  return (
    <ApprovalDetailClient
      pageType={pageType}
      approvalDetail={approvalDetail}
      departmentOptions={departmentOptions}
      requestId={id}
      initialSchema={initialSchema}
    />
  );
}
