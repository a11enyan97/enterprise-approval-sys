"use client";

import { Button, Spin } from "@arco-design/web-react";
import { IconArrowLeft } from "@arco-design/web-react/icon";
import { useRouter } from "next/navigation";
import type { ApprovalRequestItem } from "@/types/approval";
import type { CascaderOption } from "@/types/departments";
import type { FormSchema } from "@/types/formBuilder";
import { PageTypeEnum } from "@/types/approval";
import ApprovalForm from "./ApprovalFormClient";
import { useApprovalDetailLogic } from "@/hooks/business/approval/useApprovalDetailLogic";

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
  
  const { state, methods } = useApprovalDetailLogic({
    initialSchema,
    approvalDetail,
    templateId,
    requestId,
    submissionId,
    pageType,
  });

  const { form, saving, formSchema, isReadOnly, contextHolder } = state;
  const { handleSave, customRequest } = methods;

  return (
    <div className="p-6 bg-zinc-50 min-h-screen">
      {/* 页面头部 */}
      <div className="bg-white rounded-md p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-800 m-0">
            {PageTypeEnum[pageType as keyof typeof PageTypeEnum] || '审批详情页'}
          </div>
          <Button type="text" onClick={() => {
             if (window.history.length > 1) {
               router.back();
             } else {
               router.push('/approval');
             }
          }}>
            <IconArrowLeft />
            返回
          </Button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="bg-white rounded-md p-6">
        <Spin loading={saving} style={{ width: '100%' }}>
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
      {contextHolder} {/* 显示消息提示 */}
    </div>
  );
}
