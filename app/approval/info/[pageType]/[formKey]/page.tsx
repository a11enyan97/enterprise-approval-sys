import { notFound, redirect } from "next/navigation";
import { getApprovalRequestById } from "@/services/approval.service";
import { getDepartmentCascaderOptions } from "@/services/departments.service";
import { getFormTemplateByKeyAction } from "@/actions/form.action";
import { getApprovalFormSchemaAction } from "@/actions/approval.action";
import type { FormSchema } from "@/types/formBuilder";
import ApprovalDetailClient from "@/components/business/approval/ApprovalDetailClient";

interface ApprovalDetailPageProps {
  params: Promise<{ pageType: string; formKey?: string }>;
  searchParams: Promise<{ submissionId?: string, requestId?: string }>;
}

export default async function ApprovalDetailPage({
  params,
  searchParams,
}: ApprovalDetailPageProps) {
  const { pageType, formKey } = await params;
  const { submissionId, requestId } = await searchParams;

  // 验证 pageType
  const validPageTypes = ["add", "details", "edit"];
  if (!validPageTypes.includes(pageType)) {
    notFound();
  }

    // 如果是详情页或编辑页，必须提供 requestId
  const isDetailsOrEdit = pageType === "details" || pageType === "edit";
  if (isDetailsOrEdit && !requestId) {
    redirect("/approval");
  }

  // 定义 Schema 获取逻辑以支持并行
  const schemaPromise = (async () => {
    if (formKey) {
      const res = await getFormTemplateByKeyAction(formKey);
      if (res.success && res.data?.schema) {
        return { schema: res.data.schema as FormSchema, id: res.data.id };
      }
    }
    const fallback = await getApprovalFormSchemaAction("approval.create");
    if (!fallback.success || !fallback.data) {
      throw new Error(fallback.error || "表单配置获取失败");
    }
    return { schema: fallback.data, id: undefined };
  })();

  // 在 Server Component 中并行获取数据
  const [approvalDetail, departmentOptions, schemaData] = await Promise.all([
    isDetailsOrEdit && requestId
      ? getApprovalRequestById(BigInt(requestId))
      : Promise.resolve(null),
    getDepartmentCascaderOptions(),
    schemaPromise
  ]);
  console.log("服务端获取approvalDetail数据：", approvalDetail);
  console.log("服务端获取departmentOptions数据：", departmentOptions);
  console.log("服务端获取schemaData数据：", schemaData.schema);
  

  // 如果是详情页或编辑页但数据不存在，返回 404
  if (isDetailsOrEdit && !approvalDetail) {
    notFound();
  }

  const initialSchema = schemaData.schema;
  const templateId = schemaData.id; 

  return (
    <ApprovalDetailClient
      requestId={requestId}
      submissionId={submissionId}
      templateId={templateId}
      pageType={pageType}
      approvalDetail={approvalDetail}
      departmentOptions={departmentOptions}
      initialSchema={initialSchema}
    />
  );
}
