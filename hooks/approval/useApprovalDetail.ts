"use client";

/**
 * 审批详情页逻辑 Hook
 *
 * 职责：
 * 1. 管理表单实例与 Schema 状态
 * 2. 审批详情数据回显（日期、附件等特殊字段的转换）
 * 3. 保存/提交逻辑（表单校验 → 附件上传 → Server Action 调用）
 * 4. 自定义上传拦截（格式 & 大小校验，延迟上传）
 */

import { useState, useEffect } from "react";
import { Form, Message } from "@arco-design/web-react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { submitFormWithApprovalAction, updateFormSubmissionWithApprovalAction } from "@/actions/form.action";
import { deleteOSSFiles } from "@/actions/oss.action";
import { uploadAllAttachments } from "@/utils/attachmentUploader";
import { formatAttachmentsForForm, convertExistingAttachmentsToInput, cleanFormData } from "@/utils/formatUtils";
import { showErrorMessage, showSuccessMessage } from "@/utils/approvalUtils";
import { ensureLoggedIn, ensureRole } from "@/utils/authGuard";
import { useUserStore, type UserStore } from "@/store/useUserStore";
import type { UploadItem } from "@arco-design/web-react/es/Upload";
import type { ApprovalRequestItem, AttachmentInput } from "@/types/approval";
import type { FormSchema } from "@/types/formBuilder";

// ================================================================
// 类型定义
// ================================================================

interface UseApprovalDetailParams {
  requestId?: string;
  templateId?: string;
  submissionId?: string;
  pageType: string;
  approvalDetail: ApprovalRequestItem | null;
  initialSchema: FormSchema;
}

interface UseApprovalDetailReturn {
  /** Arco Form 实例 */
  form: ReturnType<typeof Form.useForm>[0];
  /** 当前 Schema */
  formSchema: FormSchema | null;
  /** 是否只读 */
  isReadOnly: boolean;
  /** 是否正在保存 */
  saving: boolean;
  /** Message contextHolder（需挂载到组件树） */
  contextHolder: React.ReactNode;
  /** 保存/提交处理 */
  handleSave: () => Promise<void>;
  /** 自定义上传函数（传给 Upload 组件） */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customRequest: (option: any) => Promise<void>;
}

// ================================================================
// Hook 实现
// ================================================================

export default function useApprovalDetail({
  requestId,
  templateId,
  submissionId,
  pageType,
  approvalDetail,
  initialSchema,
}: UseApprovalDetailParams): UseApprovalDetailReturn {
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [message, contextHolder] = Message.useMessage();
  const user = useUserStore((state: UserStore) => state.user);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(initialSchema);
  const isReadOnly = pageType === "details";

  // ── Schema 同步 ──
  useEffect(() => {
    setFormSchema(initialSchema);
  }, [initialSchema]);

  // ── 表单值回显 ──
  useEffect(() => {
    if (approvalDetail && formSchema) {
      const imageAttachments = formatAttachmentsForForm(approvalDetail.attachments, "image");
      const tableAttachments = formatAttachmentsForForm(approvalDetail.attachments, "table");

      if (approvalDetail.submission?.data) {
        const values = { ...approvalDetail.submission.data };

        // 特殊字段类型转换（日期、日期范围、时间、附件等）
        formSchema.fields.forEach((field) => {
          const val = values[field.key];
          switch (field.type) {
            case "date":
              if (val) values[field.key] = dayjs(val);
              break;
            case "dateRange":
              if (Array.isArray(val) && val.length === 2) {
                values[field.key] = [dayjs(val[0]), dayjs(val[1])];
              }
              break;
            case "timePicker":
              if (val) values[field.key] = dayjs(val, "HH:mm");
              break;
            case "uploadImage":
              values[field.key] = imageAttachments;
              break;
            case "uploadTable":
              values[field.key] = tableAttachments;
              break;
            default:
              break;
          }
        });

        form.setFieldsValue(values);
      } else {
        showErrorMessage(message, "表单数据不存在");
      }
    }
  }, [approvalDetail, form, formSchema, message]);

  // ── 保存处理 ──
  const handleSave = async () => {
    if (!ensureLoggedIn(user)) return;
    if (!ensureRole(user, ["applicant", "approver"])) return;

    try {
      const values = await form.validate();
      setSaving(true);

      let imageFileList: UploadItem[] = [];
      let tableFileList: UploadItem[] = [];
      let generalFileList: UploadItem[] = [];

      // 动态查找附件字段的值
      formSchema?.fields.forEach((field) => {
        if (field.type === "uploadImage") {
          imageFileList = values[field.key] || [];
        } else if (field.type === "uploadTable") {
          tableFileList = values[field.key] || [];
        } else if (field.type === "upload") {
          generalFileList = values[field.key] || [];
        }
      });

      // 并行上传
      const results = await Promise.allSettled([
        uploadAllAttachments(imageFileList, "image"),
        uploadAllAttachments(tableFileList, "table"),
        ...(generalFileList.length > 0 ? [uploadAllAttachments(generalFileList, "file")] : []),
      ]);

      // 提取成功上传的文件
      const successfulAttachments = results
        .filter((r): r is PromiseFulfilledResult<AttachmentInput[]> => r.status === "fulfilled")
        .flatMap((r) => r.value);

      // 任何一个失败 → 回滚已成功的
      if (results.some((r) => r.status === "rejected")) {
        if (successfulAttachments.length > 0) {
          await deleteOSSFiles(successfulAttachments).catch(() => console.error("回滚清理失败"));
        }
        const errors = results
          .filter((r): r is PromiseRejectedResult => r.status === "rejected")
          .map((r) => (r.reason instanceof Error ? r.reason.message : "上传失败"))
          .join("；");
        throw new Error(errors || "附件上传失败");
      }

      // 合并所有附件
      const allAttachments = [
        ...successfulAttachments,
        ...convertExistingAttachmentsToInput(imageFileList, "image", approvalDetail),
        ...convertExistingAttachmentsToInput(tableFileList, "table", approvalDetail),
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        const targetSubmissionId = submissionId || approvalDetail?.submissionId;
        if (!targetSubmissionId) {
          throw new Error("无法编辑：缺少关联的表单记录ID");
        }
        result = await updateFormSubmissionWithApprovalAction(targetSubmissionId, {
          data: cleanedValues,
          schema: formSchema as FormSchema,
          attachments: allAttachments,
          updatedBy: user?.id as number,
        });
      }

      if (!result?.success) {
        throw new Error(result?.error || "表单保存失败");
      }
      showSuccessMessage(message, "保存成功", () => {
        router.push("/approval");
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "保存失败";
      showErrorMessage(message, errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // ── 自定义上传：不立即上传，仅做格式 & 大小校验 ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customRequest = async (option: any) => {
    const { onSuccess, file } = option;

    // 图片格式验证
    if (file.type && file.type.startsWith("image/")) {
      const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedImageTypes.includes(file.type)) {
        const errorMsg = `不支持的图片格式：${file.name}，仅支持 JPG、PNG、GIF、WebP`;
        showErrorMessage(message, errorMsg);
        throw new Error(errorMsg);
      }
    }

    // Excel 文件大小验证
    if (
      file.type &&
      (file.type.includes("spreadsheetml") ||
        file.type.includes("ms-excel") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".xls"))
    ) {
      const maxSizeBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(0);
        const errorMsg = `文件大小超过限制：${file.name}（${fileSizeMB}MB），最大支持 ${maxSizeMB}MB`;
        showErrorMessage(message, errorMsg);
        throw new Error(errorMsg);
      }
    }

    onSuccess({
      name: file.name,
      originFile: file,
    });
  };

  return {
    form,
    formSchema,
    isReadOnly,
    saving,
    contextHolder,
    handleSave,
    customRequest,
  };
}
