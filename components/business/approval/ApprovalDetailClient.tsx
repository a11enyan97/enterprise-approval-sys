"use client";

import { Form, Button, Message, Spin } from "@arco-design/web-react";
import { IconArrowLeft } from "@arco-design/web-react/icon";
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { createApprovalAction, submitApprovalAction } from "@/actions/approval.action";
import { deleteOSSFiles } from "@/actions/oss.action";
import { uploadAllAttachments } from "@/utils/attachmentUploader";
import { formatAttachmentsForForm, convertExistingAttachmentsToInput } from "@/utils/formatUtils";
import { showErrorMessage, showSuccessMessage } from "@/utils/approvalUtils";
import { useUserStore } from "@/store/userStore";
import type { ApprovalRequestItem, AttachmentInput } from "@/types/approval";
import type { CascaderOption } from "@/types/departments";
import type { FormSchema } from "@/types/form";
import { PageTypeEnum } from "@/types/approval";
import ApprovalForm from "./ApprovalFormClient";
import { ensureLoggedIn, ensureRole } from "@/utils/authGuard";

interface ApprovalDetailClientProps {
  pageType: string;
  approvalDetail: ApprovalRequestItem | null;
  departmentOptions: CascaderOption[];
  requestId?: string | null;
  initialSchema: FormSchema;
}

export default function ApprovalDetailClient({
  pageType,
  approvalDetail,
  departmentOptions,
  requestId,
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
    if (approvalDetail) {
      const imageAttachments = formatAttachmentsForForm(approvalDetail.attachments, "image");
      const tableAttachments = formatAttachmentsForForm(approvalDetail.attachments, "table");
      const deptId = (approvalDetail.deptLevel3Id || approvalDetail.deptLevel2Id || approvalDetail.deptLevel1Id)?.toString();

      form.setFieldsValue({
        projectName: approvalDetail.projectName,
        approvalContent: approvalDetail.approvalContent,
        executionDate: approvalDetail.executeDate ? dayjs(approvalDetail.executeDate) : undefined,
        applicationDepartment: deptId, // 使用部门ID而不是路径
        imageAttachments,
        tableAttachments,
      });
    }
  }, [approvalDetail, form]);

  // 保存处理
  const handleSave = async () => {
    // 仅允许申请人/审批人
    if (!ensureLoggedIn(user)) return;
    if (!ensureRole(user, ["applicant", "approver"])) return;

    try {
      // 1. 表单校验通过的表单数据
      const values = await form.validate();
      setSaving(true);

      // 2. 先上传所有待上传的附件
      const imageFileList = values.imageAttachments || [];
      const tableFileList = values.tableAttachments || [];
      const [imageResult, tableResult] = await Promise.allSettled([
        uploadAllAttachments(imageFileList, 'image'),
        uploadAllAttachments(tableFileList, 'table'),
      ]);

      let imageAttachments: AttachmentInput[] = [];
      let tableAttachments: AttachmentInput[] = [];
      if (imageResult.status === 'fulfilled') {
        imageAttachments = imageResult.value;
      }
      if (tableResult.status === 'fulfilled') {
        tableAttachments = tableResult.value;
      }

      // 检查是否有失败
      const hasFailure = imageResult.status === 'rejected' || tableResult.status === 'rejected';
      if (hasFailure) {
        const allUploadedFiles: AttachmentInput[] = [
          ...imageAttachments,
          ...tableAttachments,
        ];

        // 如果有已上传的文件，回退它们
        if (allUploadedFiles.length > 0) {
          try {
            await deleteOSSFiles(allUploadedFiles);
          } catch (rollbackError) {
            throw new Error('回退文件失败');
          }
        }

        // 构建错误信息
        const errors: string[] = [];
        if (imageResult.status === 'rejected') {
          const reason = imageResult.reason;
          errors.push(`图片上传失败: ${reason instanceof Error ? reason.message : '未知错误'}`);
        }
        if (tableResult.status === 'rejected') {
          const reason = tableResult.reason;
          errors.push(`表格上传失败: ${reason instanceof Error ? reason.message : '未知错误'}`);
        }
        const msg = errors.join('；');
        throw new Error(msg);
      }

      // 3. 如果全部上传成功,则合并所有附件（包括新上传的和已存在的）
      const allAttachments = [
        ...imageAttachments,  // 新上传的图片
        ...tableAttachments,  // 新上传的表格
        // 已存在的附件（编辑时才有，有 url 但没有 originFile）
        ...convertExistingAttachmentsToInput(imageFileList, 'image', approvalDetail),
        ...convertExistingAttachmentsToInput(tableFileList, 'table', approvalDetail),
      ];

      // 4. 构建请求数据（只传递部门ID，服务端会自动构建完整路径）
      const requestData = {
        projectName: values.projectName,
        approvalContent: values.approvalContent,
        executeDate: values.executionDate ? dayjs(values.executionDate).toISOString() : new Date().toISOString(),
        applicantId: user.id,
        deptId: values.applicationDepartment || null, // 只传递部门ID
        attachments: allAttachments,
      };

      // 5. 调用 Server Action 保存数据
      let result: any;
      if (pageType === "add") {
        result = await createApprovalAction(requestData);
      } else if (requestId) {
        result = await submitApprovalAction(requestId, requestData);
      }
      if (!result?.success) {
        throw new Error("error" in result ? result.error : "保存失败");
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


