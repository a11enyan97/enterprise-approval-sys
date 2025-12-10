"use client";

import { Form, Button, Message, Spin } from "@arco-design/web-react";
import { IconArrowLeft } from "@arco-design/web-react/icon";
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { createApprovalAction, submitApprovalAction, getApprovalFormSchemaAction } from "@/actions/approval.action";
import { deleteOSSFiles } from "@/actions/oss.action";
import { uploadToOSS } from "@/utils/fileUploadUtil";
import { compressImage } from "@/utils/imageCompressor";
import { validateExcelFile } from "@/utils/excelValidator";
import { formatAttachmentsForForm, convertExistingAttachmentsToInput } from "@/utils/formatUtils";
import { showErrorMessage, showSuccessMessage } from "@/utils/approvalUtils";
import { useUserStore } from "@/store/userStore";
import type { ApprovalRequestItem, AttachmentInput } from "@/types/approval";
import type { CascaderOption } from "@/types/departments";
import type { FormSchema } from "@/types/form";
import { PageTypeEnum } from "@/types/approval";
import ApprovalForm from "./ApprovalFormClient";

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
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState<boolean>(false);
  const [message, contextHolder] = Message.useMessage();
  const { user } = useUserStore();
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState<boolean>(false);
  const schemaFetchedRef = useRef(false); // 防止重复请求

  // 判断是否为只读模式（详情页）
  const isReadOnly = pageType === 'details';

  useEffect(() => {
    // 防止 React Strict Mode 导致的重复请求
    if (schemaFetchedRef.current) {
      return;
    }
    schemaFetchedRef.current = true;

    const fetchSchema = async () => {
      setSchemaLoading(true);
      try {
        const res = await getApprovalFormSchemaAction("approval.create");
        if (!res.success || !res.data) {
          throw new Error(res.error || "表单配置获取失败");
        }
        setFormSchema(res.data);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "表单配置获取失败";
        showErrorMessage(message, msg);
      } finally {
        setSchemaLoading(false);
      }
    };
    fetchSchema();
  }, []); // 空依赖数组：只在组件挂载时执行一次

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

      const uploadResults = await Promise.allSettled([
        uploadAllAttachments(imageFileList, 'image'),
        uploadAllAttachments(tableFileList, 'table'),
      ]);

      // 处理上传结果
      const imageResult = uploadResults[0];
      const tableResult = uploadResults[1];
      if (imageResult.status === 'fulfilled') {
        imageAttachments = imageResult.value;
      }
      if (tableResult.status === 'fulfilled') {
        tableAttachments = tableResult.value;
      }

      // 检查是否有失败
      const hasFailure = imageResult.status === 'rejected' || tableResult.status === 'rejected';
      if (hasFailure) {
        // 收集所有已成功上传的文件
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
      let result: any;
      if (pageType === "add") {
        result = await createApprovalAction(requestData);
      } else if (requestId) {
        result = await submitApprovalAction(requestId, requestData);
      }
      if (!result.success) {
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
    const { onSuccess, onError, file } = option;
    
      // 图片格式验证
      if (file.type && file.type.startsWith('image/')) {
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedImageTypes.includes(file.type)) {
          const error = new Error('不支持的图片格式，仅支持 JPG、PNG、GIF、WebP');
          showErrorMessage(message, error.message);
          onError?.(error);
          return;
        }
      }
    
      // Excel 文件大小验证
      if (file.type && (file.type.includes('spreadsheetml') || file.type.includes('ms-excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
        validateExcelFileSize(file);
      }
      
      onSuccess({
        name: file.name,
        // 不设置 url，表示这是待上传的文件
        originFile: file,
      });
  };

  // 上传单个文件到 OSS
  // 上传策略：使用预签名URL直传，文件直接从客户端上传到OSS
  const uploadFileToOSS = async (file: File): Promise<{ url: string; filename: string }> => {
    const result = await uploadToOSS(file);
    return {
      url: result.publicUrl,
      filename: result.filename,
    };
  };

  // 验证图片格式
  const validateImageFile = (file: File): void => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showErrorMessage(message, `不支持的图片格式：${file.name}，仅支持 JPG、PNG、GIF、WebP`);
      throw new Error(`不支持的图片格式：${file.name}，仅支持 JPG、PNG、GIF、WebP`);
    }
  };

  // 验证 Excel 文件大小
  const validateExcelFileSize = (file: File): void => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
      showErrorMessage(message, `文件大小超过限制：${file.name}（${fileSizeMB}MB），最大支持 ${maxSizeMB}MB`);
      throw new Error(`文件大小超过限制：${file.name}（${fileSizeMB}MB），最大支持 ${maxSizeMB}MB`);
    }
  };

  // 上传所有待上传的附件
  const uploadAllAttachments = async (fileList: any[], attachmentType: 'image' | 'table')
    : Promise<Array<AttachmentInput>> => {
    const filesToUpload = fileList.filter((file) => {
      const shouldUpload = !file.url && file.originFile;
      return shouldUpload;
    });
    
    // 图片格式验证
    if (attachmentType === 'image') {
      filesToUpload.forEach((file) => {
        validateImageFile(file.originFile);
      });
    }
    
    // Excel 格式和大小验证
    if (attachmentType === 'table') {
      // 先验证文件大小
      filesToUpload.forEach((file) => {
        validateExcelFileSize(file.originFile);
      });
      // 再验证文件格式和内容
      await Promise.all(
        filesToUpload.map((file) => {
          return validateExcelFile(file.originFile);
        })
      );
    }
    const uploadResults = await Promise.allSettled(
      filesToUpload.map(async (file) => {
        try {
          // 图片上传前压缩，保证 1MB 内且最长边 1920
          const uploadFile =
            attachmentType === "image"
              ? await compressImage(file.originFile)
              : file.originFile;

          const result = await uploadFileToOSS(uploadFile);
          return {
            filePath: result.url,
            fileName: file.name || uploadFile.name || file.originFile.name,
            attachmentType,
            fileSize: uploadFile.size || 0,
            mimeType: uploadFile.type || file.originFile.type || null,
          };
        } catch (uploadError) {
          throw uploadError;
        }
      })
    );
    const successfulResults: AttachmentInput[] = [];
    let failedCount = 0;
    uploadResults.forEach(result => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        failedCount++;
      }
    });
    if (failedCount > 0) {
      if (successfulResults.length > 0) {
        await deleteOSSFiles(successfulResults); // OSS文件回滚
      }
      throw new Error('部分文件上传失败，已取消所有操作');
    }

    // 6. 全部成功，返回 URL 列表
    return successfulResults;
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
        <Spin loading={saving || schemaLoading} style={{ width: '100%' }}>
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


