"use client";

import { Form, Button, Message, Spin } from "@arco-design/web-react";
import { IconArrowLeft } from "@arco-design/web-react/icon";
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { submitFormWithApprovalAction,updateFormSubmissionWithApprovalAction } from "@/actions/form.action";
import { deleteOSSFiles } from "@/actions/oss.action";
import { uploadAllAttachments } from "@/utils/attachmentUploader";
import { formatAttachmentsForForm, convertExistingAttachmentsToInput, cleanFormData } from "@/utils/formatUtils";
import { showErrorMessage, showSuccessMessage } from "@/utils/approvalUtils";
import { useUserStore } from "@/store/userStore";
import type { ApprovalRequestItem, AttachmentInput } from "@/types/approval";
import type { CascaderOption } from "@/types/departments";
import type { FormSchema } from "@/types/formBuilder";
import { PageTypeEnum } from "@/types/approval";
import ApprovalForm from "./ApprovalFormClient";
import { ensureLoggedIn, ensureRole } from "@/utils/authGuard";

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
  const [form] = Form.useForm();
  const [saving, setSaving] = useState<boolean>(false);
  const [message, contextHolder] = Message.useMessage();
  const { user } = useUserStore();
  const [formSchema, setFormSchema] = useState<FormSchema | null>(initialSchema);
  const isReadOnly = pageType === 'details';

  // Schema 已在服务端获取，这里仅在初始值变更时同步
  useEffect(() => {
    setFormSchema(initialSchema);
  }, [initialSchema]);

  // 处理审批详情数据变化，设置表单值
  useEffect(() => {
    if (approvalDetail && formSchema) {
      const imageAttachments = formatAttachmentsForForm(approvalDetail.attachments, "image");
      const tableAttachments = formatAttachmentsForForm(approvalDetail.attachments, "table");

      if (approvalDetail.submission?.data) {
        // 1. 使用 submission.data 回显（精确匹配）
        const values = { ...approvalDetail.submission.data };

        // 2. 特殊字段处理（日期、附件）
        formSchema.fields.forEach((field) => {
          if (field.type === "date" && values[field.key]) {
            values[field.key] = dayjs(values[field.key]);
          } else if (field.type === "uploadImage") {
            values[field.key] = imageAttachments;
          } else if (field.type === "uploadTable") {
            values[field.key] = tableAttachments;
          }
        });

        form.setFieldsValue(values);
      }else{
        showErrorMessage(message, "表单数据不存在");
      }
    }
  }, [approvalDetail, form, formSchema]);

  // 保存处理
  const handleSave = async () => {
    // 仅允许申请人/审批人
    if (!ensureLoggedIn(user)) return;
    if (!ensureRole(user, ["applicant", "approver"])) return;

    try {
      // 1. 表单校验通过的表单数据
      const values = await form.validate();
      setSaving(true);

      let imageFileList: AttachmentInput[] = [];
      let tableFileList: AttachmentInput[] = [];
      
      // 动态查找附件字段的值
      formSchema?.fields.forEach(field => {
          if (field.type === 'uploadImage') {
              imageFileList = values[field.key] || [];
          } else if (field.type === 'uploadTable') {
              tableFileList = values[field.key] || [];
          }
      });
      
      // 并行上传
      const results = await Promise.allSettled([
        uploadAllAttachments(imageFileList, 'image'),
        uploadAllAttachments(tableFileList, 'table'),
      ]);
      
      // 提取成功上传的文件（用于正常保存 或 异常回滚）
      const successfulAttachments = results
        .filter((r): r is PromiseFulfilledResult<AttachmentInput[]> => r.status === 'fulfilled')
        .flatMap(r => r.value);

      // 如果有任何一个失败，就回滚所有已成功的
      if (results.some(r => r.status === 'rejected')) {
        if (successfulAttachments.length > 0) {
          await deleteOSSFiles(successfulAttachments).catch(() => console.error("回滚清理失败"));
        }
        
        // 提取错误信息
        const errors = results
            .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
            .map(r => r.reason instanceof Error ? r.reason.message : '上传失败')
            .join('；');
            
        throw new Error(errors || '附件上传失败');
      }

      // 3. 如果全部上传成功,则合并所有附件（包括新上传的和已存在的）
      const allAttachments = [
        ...successfulAttachments,  // 新上传的文件
        // 已存在的附件（编辑时才有，有 url 但没有 originFile）
        ...convertExistingAttachmentsToInput(imageFileList, 'image', approvalDetail),
        ...convertExistingAttachmentsToInput(tableFileList, 'table', approvalDetail),
      ];

      // 5. 调用 Server Action 保存数据
      let result: any;
      const cleanedValues = cleanFormData(values);

      if (pageType === "add") {
        if (!templateId || !formSchema) {
          throw new Error("表单模板信息缺失");
        }
        result = await submitFormWithApprovalAction({
          templateId,
          data: cleanedValues,
          submittedBy: user?.id as number,
          status: "PENDING",
          schema: formSchema,
          attachments: allAttachments,
        });
      } else if (requestId) {
        // 编辑模式：基于表单的新流程
        const targetSubmissionId = submissionId || approvalDetail?.submissionId;
        
        if (!targetSubmissionId) {
            throw new Error("无法编辑：缺少关联的表单记录ID");
        }
        
        // 更新表单和审批请求
        result = await updateFormSubmissionWithApprovalAction(targetSubmissionId, {
            data: cleanedValues,
            schema: formSchema as any,
            attachments: allAttachments,
            updatedBy: user?.id as number,
        });
      }
      console.log("result：", result);
      
      if (!result?.success) {
        throw new Error(result?.error || "表单保存失败");
      }
      showSuccessMessage(message, "保存成功", () => {
        router.push('/approval');
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存失败';
      showErrorMessage(message, errorMessage);
      return;
    } finally {
      setSaving(false);
    }
  };

  // 自定义上传函数：不立即上传，只保存文件到本地，等待用户点击保存时统一上传
  const customRequest = async (option: any) => {
    const { onSuccess, file } = option;
    
      // 图片格式验证
      if (file.type && file.type.startsWith('image/')) {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedImageTypes.includes(file.type)) {
          const errorMessage = `不支持的图片格式：${file.name}，仅支持 JPG、PNG、GIF、WebP`;
          showErrorMessage(message, errorMessage);
          throw new Error(errorMessage);
        }
      }
    
      // Excel 文件大小验证
      if (file.type && (file.type.includes('spreadsheetml') || file.type.includes('ms-excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        const maxSizeBytes = 10 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
          const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(0);
          const errorMessage = `文件大小超过限制：${file.name}（${fileSizeMB}MB），最大支持 ${maxSizeMB}MB`;
          showErrorMessage(message, errorMessage);
          throw new Error(errorMessage);
        }
      }
      
      onSuccess({
        name: file.name,
        // 不设置 url，表示这是待上传的文件
        originFile: file,
      });
  };

  return (
    <div className="p-6 bg-zinc-50 min-h-screen">
      {/* 页面头部 */}
      <div className="bg-white rounded-md p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-800 m-0">
            {PageTypeEnum[pageType as keyof typeof PageTypeEnum] || '审批详情页'}
          </div>
          <Button type="text" onClick={() => router.push('/approval')}>
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


