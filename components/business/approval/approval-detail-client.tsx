"use client";

import { Form, Input, DatePicker, TreeSelect, Button, Grid, Upload, Message, Spin } from "@arco-design/web-react";
import { IconArrowLeft } from "@arco-design/web-react/icon";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { createApprovalAction, submitApprovalAction } from "@/actions/approval.action";
import { getOSSTokenAction } from "@/actions/oss.action";
import { useUserStore } from "@/store/userStore";
import type { ApprovalRequestItem } from "@/types/approval";
import type { CascaderOption } from "@/types/departments";

const FormItem = Form.Item;
const { Row, Col } = Grid;
const TextArea = Input.TextArea;

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
        })) || [];

      const tableAttachments = approvalDetail.attachments
        ?.filter(att => att.attachmentType === "table")
        .map(att => ({
          uid: att.id,
          url: att.filePath,
          name: att.fileName,
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
      const values = await form.validate();
      setSaving(true);

      // 构建请求数据（只传递部门ID，服务端会自动构建完整路径）
      const requestData = {
        projectName: values.projectName,
        approvalContent: values.approvalContent,
        executeDate: values.executionDate ? dayjs(values.executionDate).toISOString() : new Date().toISOString(),
        applicantId: user.id,
        deptId: values.applicationDepartment || null, // 只传递部门ID
      };

      // 调用 Server Action 保存数据
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

  // 判断文件是否符合上传要求
  const isAcceptFile = (file: File, accept: string) => {
    if (accept && file) {
      const accepts = Array.isArray(accept)
        ? accept
        : accept
            .split(',')
            .map((x) => x.trim())
            .filter((x) => x);
      const fileExtension = file.name.indexOf('.') > -1 ? file.name.split('.').pop() : '';
      return accepts.some((type) => {
        const text = type && type.toLowerCase();
        const fileType = (file.type || '').toLowerCase();
        if (text === fileType) {
          return true;
        }
        if (new RegExp('\/\*').test(text)) {
          const regExp = new RegExp('\/.*$');
          return fileType.replace(regExp, '') === text.replace(regExp, '');
        }
        if (new RegExp('\..*').test(text)) {
          return text === `.${fileExtension && fileExtension.toLowerCase()}`;
        }
        return false;
      });
    }
    return !!file;
  };

  // 自定义上传函数：使用 OSS 预签名 URL
  const customRequest = async (option: any) => {
    const { onProgress, onError, onSuccess, file } = option;

    try {
      // 1. 获取预签名 URL（使用 Server Action）
      const tokenResult = await getOSSTokenAction(file.name, file.type || 'application/octet-stream');
      
      if (!tokenResult.success) {
        throw new Error("error" in tokenResult ? tokenResult.error : '获取上传地址失败');
      }

      const { uploadUrl, publicUrl } = tokenResult;

      // 2. 使用预签名 URL 上传文件到 OSS
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

      onSuccess({
        url: publicUrl,
        name: file.name,
      });
    } catch (error: any) {
      Message.error(error?.message || '上传失败，请重试');
      onError(error);
    }
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
          <Form
            form={form}
            layout="horizontal"
            {...formItemLayout}
          >
            <FormItem
              label="审批项目"
              field="projectName"
              rules={[{ required: !isReadOnly, message: '请输入审批项目' }]}
            >
              <Input
                placeholder="请输入审批项目"
                disabled={isReadOnly}
                style={{ width: '100%' }}
              />
            </FormItem>
            <FormItem
              label="申请部门"
              field="applicationDepartment"
              rules={[{ required: !isReadOnly, message: '请选择申请部门' }]}
            >
              <TreeSelect
                treeData={departmentOptions}
                placeholder="请选择部门"
                allowClear
                style={{ width: "100%" }}
                disabled={isReadOnly}
                loading={deptLoading}
                fieldNames={{
                  title: "title",
                  key: "key",
                  children: "children",
                }}
              />
            </FormItem>
            <FormItem
              label="审批内容"
              field="approvalContent"
              rules={[
                { required: !isReadOnly, message: '请输入审批内容' },
                { maxLength: 300, message: '审批内容不能超过300字' }
              ]}
            >
              <TextArea
                placeholder="请输入审批内容，限制300字内"
                disabled={isReadOnly}
                maxLength={300}
                showWordLimit
                autoSize={{ minRows: 4, maxRows: 8 }}
                style={{ width: '100%' }}
              />
            </FormItem>

            <FormItem
              label="执行日期"
              field="executionDate"
              rules={[{ required: !isReadOnly, message: '请选择执行日期' }]}
            >
              <DatePicker
                placeholder="请选择执行日期"
                disabled={isReadOnly}
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
            </FormItem>
            <FormItem
              label="图片附件"
              field="imageAttachments"
              triggerPropName='fileList'
            >
              <Upload
                multiple
                imagePreview
                limit={3}
                customRequest={customRequest}
                listType='picture-card'
                disabled={isReadOnly}
              />
            </FormItem>
            <FormItem
              label="表格附件"
              field="tableAttachments"
              triggerPropName="fileList"
            >
              <Upload
                customRequest={customRequest}
                accept='.xlsx,.xls'
                disabled={isReadOnly}
              />
            </FormItem>

            {!isReadOnly && (
              <Row>
                <Col span={24}>
                  <FormItem>
                    <Button type="primary" onClick={handleSave} loading={saving}>
                      保存
                    </Button>
                  </FormItem>
                </Col>
              </Row>
            )}
          </Form>
        </Spin>
      </div>
    </div>
  );
}


