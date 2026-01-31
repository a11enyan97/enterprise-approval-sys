import { useState, useEffect } from "react";
import { Form, Message } from "@arco-design/web-react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { submitFormWithApprovalAction, updateFormSubmissionWithApprovalAction } from "@/actions/form.action";
import { deleteOSSFiles } from "@/actions/oss.action";
import { uploadAllAttachments } from "@/utils/attachmentUploader";
import { formatAttachmentsForForm, convertExistingAttachmentsToInput, cleanFormData } from "@/utils/formatUtils";
import { showErrorMessage, showSuccessMessage } from "@/utils/approvalUtils";
import { useUserStore, type UserStore } from "@/store/useUserStore";
import { ensureLoggedIn, ensureRole } from "@/utils/authGuard";
import type { ApprovalRequestItem, AttachmentInput } from "@/types/approval";
import type { FormSchema } from "@/types/formBuilder";

interface UseApprovalDetailLogicProps {
  initialSchema: FormSchema;
  approvalDetail: ApprovalRequestItem | null;
  templateId?: string;
  requestId?: string;
  submissionId?: string;
  pageType: string;
}

export function useApprovalDetailLogic({
  initialSchema,
  approvalDetail,
  templateId,
  requestId,
  submissionId,
  pageType,
}: UseApprovalDetailLogicProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState<boolean>(false);
  const [message, contextHolder] = Message.useMessage();
  const user = useUserStore((state: UserStore) => state.user);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(initialSchema);
  const isReadOnly = pageType === 'details';

  // Schema 同步
  useEffect(() => {
    setFormSchema(initialSchema);
  }, [initialSchema]);

  // 数据回显
  useEffect(() => {
    if (approvalDetail && formSchema) {
      const imageAttachments = formatAttachmentsForForm(approvalDetail.attachments, "image");
      const tableAttachments = formatAttachmentsForForm(approvalDetail.attachments, "table");

      if (approvalDetail.submission?.data) {
        const values = { ...approvalDetail.submission.data };

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
      } else {
        showErrorMessage(message, "表单数据不存在");
      }
    }
  }, [approvalDetail, form, formSchema, message]);

  // 核心保存逻辑
  const handleSave = async () => {
    if (!ensureLoggedIn(user)) return;
    if (!ensureRole(user, ["applicant", "approver"])) return;

    try {
      const values = await form.validate();
      setSaving(true);

      let imageFileList: AttachmentInput[] = [];
      let tableFileList: AttachmentInput[] = [];
      
      formSchema?.fields.forEach(field => {
          if (field.type === 'uploadImage') {
              imageFileList = values[field.key] || [];
          } else if (field.type === 'uploadTable') {
              tableFileList = values[field.key] || [];
          }
      });
      
      const results = await Promise.allSettled([
        uploadAllAttachments(imageFileList, 'image'),
        uploadAllAttachments(tableFileList, 'table'),
      ]);
      
      const successfulAttachments = results
        .filter((r): r is PromiseFulfilledResult<AttachmentInput[]> => r.status === 'fulfilled')
        .flatMap(r => r.value);

      if (results.some(r => r.status === 'rejected')) {
        if (successfulAttachments.length > 0) {
          await deleteOSSFiles(successfulAttachments).catch(() => console.error("回滚清理失败"));
        }
        
        const errors = results
            .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
            .map(r => r.reason instanceof Error ? r.reason.message : '上传失败')
            .join('；');
            
        throw new Error(errors || '附件上传失败');
      }

      const allAttachments = [
        ...successfulAttachments,
        ...convertExistingAttachmentsToInput(imageFileList, 'image', approvalDetail),
        ...convertExistingAttachmentsToInput(tableFileList, 'table', approvalDetail),
      ];

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
            schema: formSchema as any,
            attachments: allAttachments,
            updatedBy: user?.id as number,
        });
      }
      
      if (!result?.success) {
        throw new Error(result?.error || "表单保存失败");
      }
      showSuccessMessage(message, "保存成功", () => {
        router.push('/approval');
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存失败';
      showErrorMessage(message, errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const customRequest = async (option: any) => {
    const { onSuccess, file } = option;
    
      if (file.type && file.type.startsWith('image/')) {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedImageTypes.includes(file.type)) {
          const errorMessage = `不支持的图片格式：${file.name}，仅支持 JPG、PNG、GIF、WebP`;
          showErrorMessage(message, errorMessage);
          throw new Error(errorMessage);
        }
      }
    
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
        originFile: file,
      });
  };

  return {
    state: {
      form,
      saving,
      formSchema,
      isReadOnly,
      contextHolder,
    },
    methods: {
      handleSave,
      customRequest,
    }
  };
}

