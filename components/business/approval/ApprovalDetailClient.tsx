"use client";

import { Form, Button, Message, Spin } from "@arco-design/web-react";
import { IconArrowLeft } from "@arco-design/web-react/icon";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { createApprovalAction, submitApprovalAction } from "@/actions/approval.action";
import { uploadToOSS } from "@/utils/fileUploadUtil";
import { useUserStore } from "@/store/userStore";
import type { ApprovalRequestItem, AttachmentInput } from "@/types/approval";
import type { CascaderOption } from "@/types/departments";
import ApprovalForm from "./ApprovalFormClient";
import { PageTypeEnum } from "@/types/approval";
import { FORM_ITEM_LAYOUT } from "@/constants/approval";
import { formatAttachmentsForForm, convertExistingAttachmentsToInput} from "@/utils/format";

interface ApprovalDetailClientProps {
  pageType: string;
  approvalDetail: ApprovalRequestItem | null;
  departmentOptions: CascaderOption[];
  requestId?: string | null;
}

export default function ApprovalDetailClient({
  pageType,
  approvalDetail,
  departmentOptions,
  requestId,
}: ApprovalDetailClientProps) {
  const [form] = Form.useForm();
  const router = useRouter();
  const [saving, setSaving] = useState<boolean>(false);

  const { user } = useUserStore();

  // 判断是否为只读模式（详情页）
  const isReadOnly = pageType === 'details';

  // 处理审批详情数据变化，设置表单值
  useEffect(() => {
    if (approvalDetail) {
      const imageAttachments = formatAttachmentsForForm(approvalDetail.attachments, "image");
      const tableAttachments = formatAttachmentsForForm(approvalDetail.attachments, "table");

      // 优先使用 deptLevel3Id，如果没有则使用 deptLevel2Id，最后使用 deptLevel1Id
      const deptId = approvalDetail.deptLevel3Id 
        ? String(approvalDetail.deptLevel3Id)
        : approvalDetail.deptLevel2Id
        ? String(approvalDetail.deptLevel2Id)
        : approvalDetail.deptLevel1Id
        ? String(approvalDetail.deptLevel1Id)
        : undefined;
      
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
    if (!user) {
      Message.error("请先登录");
      return;
    }

    try {
      // 1. 表单校验通过的表单数据
      const values = await form.validate();
      setSaving(true);

      // 2. 先上传所有待上传的附件
      const imageFileList = values.imageAttachments || [];
      const tableFileList = values.tableAttachments || [];

      let imageAttachments: AttachmentInput[] = [];
      let tableAttachments: AttachmentInput[] = [];

      // 先上传图片附件
      try {
        imageAttachments = await uploadAllAttachments(imageFileList, 'image');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '图片上传失败';
        throw new Error(errorMessage);
      }

      // 再上传表格附件（只有图片上传成功后才会上传表格）
      try {
        tableAttachments = await uploadAllAttachments(tableFileList, 'table');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '表格上传失败';
        throw new Error(errorMessage);
      }
 
      // 3. 合并所有附件（包括新上传的和已存在的）
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
      if (pageType === "add") {
        const result = await createApprovalAction(requestData);
        if (!result.success) {
          throw new Error("error" in result ? result.error : "保存失败");
        }
        Message.success("保存成功");
        router.push('/approval');
      } else if (requestId) {
        const result = await submitApprovalAction(requestId, requestData);
        if (!result.success) {
          throw new Error("error" in result ? result.error : "保存失败");
        }
        Message.success("保存成功");
        router.push('/approval');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "操作失败";
      Message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // 自定义上传函数：不立即上传，只保存文件到本地，等待用户点击保存时统一上传
  const customRequest = async (option: any) => {
    const { onSuccess, file } = option;

    onSuccess({
      name: file.name,
      // 不设置 url，表示这是待上传的文件
      originFile: file,
    });
  };

  // 上传单个文件到 OSS
  // 上传策略：使用预签名URL直传，文件直接从客户端上传到OSS
  const uploadFileToOSS = async (file: File): Promise<{ url: string; filename: string }> => {
    try {
      const result = await uploadToOSS(file);
      return {
        url: result.publicUrl,
        filename: result.filename,
      };
    } catch (error) {
      // 处理上传错误，提供友好的错误提示
      if (error instanceof Error) {
        // 如果错误信息已经包含详细说明，直接抛出
        if (error.message.includes('上传失败') || error.message.includes('上传超时') || error.message.includes('上传被中断')) {
          throw error;
        }
        throw new Error(`文件 "${file.name}" 上传失败：${error.message}`);
      }
      throw new Error(`文件 "${file.name}" 上传失败：未知错误`);
    }
  };

  // 上传所有待上传的附件
  const uploadAllAttachments = async (
    fileList: any[],
    attachmentType: 'image' | 'table'
  ): Promise<Array<AttachmentInput>> => {
    const filesToUpload = fileList.filter((file) => {
      // 只上传没有 url 的文件（新选择的文件）
      // 已有 url 的文件是已上传的，不需要重新上传
      return !file.url && file.originFile;
    });

    if (filesToUpload.length === 0) {
      return [];
    }

    // 逐个上传文件，如果任何一个失败，立即抛出错误，不会继续上传
    const uploadResults: AttachmentInput[] = [];
    for (const file of filesToUpload) {
      try {
        const result = await uploadFileToOSS(file.originFile);
        uploadResults.push({
          filePath: result.url,
          fileName: file.name || file.originFile.name,
          attachmentType,
          fileSize: file.originFile.size || 0,
          mimeType: file.originFile.type || null,
        });
      } catch (error) {
        // 如果上传失败，抛出错误，阻止后续操作
        const errorMessage = error instanceof Error ? error.message : '文件上传失败';
        throw new Error(errorMessage);
      }
    }

    return uploadResults;
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
            formItemLayout={FORM_ITEM_LAYOUT}
          />
        </Spin>
      </div>
    </div>
  );
}


