"use client";

import { Form, Button, Message, Spin } from "@arco-design/web-react";
import { IconArrowLeft } from "@arco-design/web-react/icon";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { createApprovalAction, submitApprovalAction } from "@/actions/approval.action";
import { getOSSTokenAction } from "@/actions/oss.action";
import { useUserStore } from "@/store/userStore";
import type { ApprovalRequestItem } from "@/types/approval";
import type { CascaderOption } from "@/types/departments";
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
  const [form] = Form.useForm();
  const router = useRouter();
  const [saving, setSaving] = useState<boolean>(false);
  const [deptLoading, setDeptLoading] = useState(false);

  const { user } = useUserStore();

  const formItemLayout = {
    labelCol: {
      span: 2,
    },
    wrapperCol: {
      span: 8,
    },
  };

  enum PageTypeEnum {
    add = '审核新增页',
    details = '审核详情页',
    edit = '审核编辑页',
  }

  // 判断是否为只读模式（详情页）
  const isReadOnly = pageType === 'details';

  // 处理审批详情数据变化，设置表单值
  useEffect(() => {
    if (approvalDetail) {
      // 处理附件数据
      const imageAttachments = approvalDetail.attachments
        ?.filter(att => att.attachmentType === "image")
        .map(att => ({
          uid: att.id,
          url: att.filePath,
          name: att.fileName,
          status: 'done',
        })) || [];

      const tableAttachments = approvalDetail.attachments
        ?.filter(att => att.attachmentType === "table")
        .map(att => ({
          uid: att.id,
          url: att.filePath,
          name: att.fileName,
          status: 'done',
        })) || [];

      // 设置表单值
      form.setFieldsValue({
        projectName: approvalDetail.projectName,
        approvalContent: approvalDetail.approvalContent,
        executionDate: approvalDetail.executeDate ? dayjs(approvalDetail.executeDate) : undefined,
        applicationDepartment: approvalDetail.deptFullPath || undefined,
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

      const [imageAttachments, tableAttachments] = await Promise.all([
        uploadAllAttachments(imageFileList, 'image'),
        uploadAllAttachments(tableFileList, 'table'),
      ]);
 
      // 合并所有附件（包括新上传的和已存在的）
      const allAttachments = [
        ...imageAttachments,  // 新上传的图片
        ...tableAttachments,  // 新上传的表格
        // 已存在的附件（编辑时才有，有 url 但没有 originFile）
        ...imageFileList
          .filter((file: any) => file.url && !file.originFile)
          .map((file: any) => {
            // 从 approvalDetail 中查找对应的附件信息
            const originalAtt = approvalDetail?.attachments?.find(
              (att) => att.attachmentType === 'image' && att.filePath === file.url
            );
            return {
              filePath: file.url,
              fileName: file.name,
              attachmentType: 'image' as const,
              fileSize: originalAtt?.fileSize ? parseInt(originalAtt.fileSize, 10) : 0,
              mimeType: originalAtt?.mimeType || null,
            };
          }),
        ...tableFileList
          .filter((file: any) => file.url && !file.originFile)
          .map((file: any) => {
            // 从 approvalDetail 中查找对应的附件信息
            const originalAtt = approvalDetail?.attachments?.find(
              (att) => att.attachmentType === 'table' && att.filePath === file.url
            );
            return {
              filePath: file.url,
              fileName: file.name,
              attachmentType: 'table' as const,
              fileSize: originalAtt?.fileSize ? parseInt(originalAtt.fileSize, 10) : 0,
              mimeType: originalAtt?.mimeType || null,
            };
          }),
      ];

      // 3. 构建请求数据（只传递部门ID，服务端会自动构建完整路径）
      const requestData = {
        projectName: values.projectName,
        approvalContent: values.approvalContent,
        executeDate: values.executionDate ? dayjs(values.executionDate).toISOString() : new Date().toISOString(),
        applicantId: user.id,
        deptId: values.applicationDepartment || null, // 只传递部门ID
        attachments: allAttachments,
      };

      // 3. 调用 Server Action 保存数据
      if (pageType === "add") {
        // 新建
        const result = await createApprovalAction(requestData);
        if (!result.success) {
          throw new Error("error" in result ? result.error : "保存失败");
        }
        Message.success("保存成功");
        router.push('/approval');
      } else if (requestId) {
        // 编辑
        const result = await submitApprovalAction(requestId, requestData);
        if (!result.success) {
          throw new Error("error" in result ? result.error : "保存失败");
        }
        Message.success("保存成功");
        router.push('/approval');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "保存失败";
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
      // 保存原始文件对象，用于后续上传
      originFile: file,
    });
  };

  // 上传单个文件到 OSS
  const uploadFileToOSS = async (file: File): Promise<{ url: string; filename: string }> => {
    // 1. 获取预签名 URL
    const tokenResult = await getOSSTokenAction(file.name, file.type || 'application/octet-stream');
    
    if (!tokenResult.success) {
      throw new Error("error" in tokenResult ? tokenResult.error : '获取上传地址失败');
    }

    // 2. 使用预签名 URL 上传文件到 OSS
    const { uploadUrl, publicUrl, filename } = tokenResult;
    const uploadContentType = file.type || 'application/octet-stream';
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': uploadContentType,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`文件上传失败: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    return { url: publicUrl, filename };
  };

  // 上传所有待上传的附件
  const uploadAllAttachments = async (
    fileList: any[],
    attachmentType: 'image' | 'table'
  ): Promise<Array<{ 
    filePath: string; 
    fileName: string; 
    attachmentType: 'image' | 'table';
    fileSize: number;
    mimeType: string | null;
  }>> => {
    const uploadPromises = fileList
      .filter((file) => {
        // 只上传没有 url 的文件（新选择的文件）
        // 已有 url 的文件是已上传的，不需要重新上传
        return !file.url && file.originFile;
      })
      .map(async (file) => {
        const result = await uploadFileToOSS(file.originFile);
        return {
          filePath: result.url,
          fileName: file.name || file.originFile.name,
          attachmentType,
          fileSize: file.originFile.size || 0,
          mimeType: file.originFile.type || null,
        };
      });

    return Promise.all(uploadPromises);
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
            deptLoading={deptLoading}
            customRequest={customRequest}
            saving={saving}
            onSave={handleSave}
            formItemLayout={formItemLayout}
          />
        </Spin>
      </div>
    </div>
  );
}


