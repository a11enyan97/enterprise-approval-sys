"use client";

/**
 * 审批详情页 — UI 层
 *
 * 逻辑层已提取到 useApprovalDetail hook，
 * 此组件只负责布局与子组件组装。
 */

import { Button, Spin } from "@arco-design/web-react";
import { IconArrowLeft } from "@arco-design/web-react/icon";
import { useRouter } from "next/navigation";
import type { ApprovalRequestItem } from "@/types/approval";
import type { CascaderOption } from "@/types/departments";
import type { FormSchema } from "@/types/formBuilder";
import { PageTypeEnum } from "@/types/approval";
import { useApprovalDetail } from "@/hooks/approval";
import ApprovalForm from "./ApprovalFormClient";

interface ApprovalDetailClientProps {
  requestId?: string;
  templateId?: string;
  submissionId?: string;
  pageType: string;
  approvalDetail: ApprovalRequestItem | null;
  departmentOptions: CascaderOption[];
  initialSchema: FormSchema;
}

export default function ApprovalDetailClient({
  templateId,
  requestId,
  submissionId,
  pageType,
  approvalDetail,
  departmentOptions,
  initialSchema,
}: ApprovalDetailClientProps) {
  const router = useRouter();

  const {
    form,
    formSchema,
    isReadOnly,
    saving,
    contextHolder,
    handleSave,
    customRequest,
  } = useApprovalDetail({
    requestId,
    templateId,
    submissionId,
    pageType,
    approvalDetail,
    initialSchema,
  });

  return (
    <div className="p-6 bg-zinc-50 min-h-screen">
      {/* 页面头部 */}
      <div className="bg-white rounded-md p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-800 m-0">
            {PageTypeEnum[pageType as keyof typeof PageTypeEnum] || "审批详情页"}
          </div>
          <Button type="text" onClick={() => router.push("/approval")}>
            <IconArrowLeft />
            返回
          </Button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="bg-white rounded-md p-6">
        <Spin loading={saving} style={{ width: "100%" }}>
          <ApprovalForm
            form={form}
            isReadOnly={isReadOnly}
            departmentOptions={departmentOptions}
            customRequest={customRequest}
            saving={saving}
            onSave={handleSave}
            formSchema={formSchema}
          />
        </Spin>
      </div>
      {contextHolder}
    </div>
  );
}
