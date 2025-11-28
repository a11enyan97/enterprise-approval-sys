"use client";

import { Form, Input, DatePicker, TreeSelect, Button, Grid, Upload, Message, Spin } from "@arco-design/web-react";
import { IconArrowLeft } from "@arco-design/web-react/icon";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { submitApprovalRequest } from "@/utils/api/approval";
import { useDepartments } from "@/hooks/useDepartments";
import { useApprovalDetail } from "@/hooks/useApprovalDetail";
import { useUserStore } from "@/store/userStore";

const FormItem = Form.Item;
const { Row, Col } = Grid;
const TextArea = Input.TextArea;

export default function ApprovalDetailPage({ params }: { params: Promise<{ pageType: string }> }) {
    const [pageType, setPageType] = useState<string>("");
    const [form] = Form.useForm();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [saving, setSaving] = useState<boolean>(false);

    const formItemLayout = {
        labelCol: {
            span: 2,
        },
        wrapperCol: {
            span: 8,
        },
    };

    // 获取 params
    useEffect(() => {
        params.then((p) => setPageType(p.pageType));
    }, [params]);

    // 获取审批详情 ID
    const requestId = searchParams.get("id");
    const isDetailsOrEdit = pageType === "details" || pageType === "edit";
    
    // 使用 Hook 获取审批详情
    const { data: approvalDetail, loading, error, refetch } = useApprovalDetail(
        isDetailsOrEdit ? requestId : null
    );

    enum PageTypeEnum {
        add = '审核新增页',
        details = '审核详情页',
        edit = '审核编辑页',
    }

    // 获取用户信息
    const { user } = useUserStore();

    // 懒加载部门数据
    const { options: departmentOptions, loading: deptLoading, refetch: refetchDepts } = useDepartments();

    // 当树形选择器展开时加载部门数据
    const handleTreeSelectVisibleChange = (visible: boolean) => {
        if (visible && departmentOptions.length === 0) {
            refetchDepts();
        }
    };

    // 根据部门ID查找部门路径（用于确定部门层级和完整路径）
    const findDeptPath = (deptId: string | number, options: any[], path: any[] = []): any[] | null => {
        for (const option of options) {
            const optionKey = typeof option.key === 'string' ? parseInt(option.key) : option.key;
            const compareValue = typeof deptId === 'string' ? parseInt(deptId) : deptId;
            const currentPath = [...path, option];

            if (optionKey === compareValue) {
                return currentPath;
            }
            if (option.children && option.children.length > 0) {
                const found = findDeptPath(deptId, option.children, currentPath);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    };

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

    // 处理错误情况
    useEffect(() => {
        if (error) {
            const errorMessage = error.message || "获取审批详情失败";
            Message.error(errorMessage);
            // 获取失败时返回列表页
            setTimeout(() => {
                router.push('/approval');
            }, 1500);
        }
    }, [error, router]);

    // 保存处理
    const handleSave = () => {
        if (!user) {
            Message.error("请先登录");
            return;
        }

        form.validate().then(async (values) => {
            try {
                setSaving(true);

                // 处理部门信息
                let deptLevel1Id: number | undefined;
                let deptLevel2Id: number | undefined;
                let deptLevel3Id: number | undefined;
                let deptFullPath: string | undefined;

                if (values.applicationDepartment) {
                    const deptPath = findDeptPath(values.applicationDepartment, departmentOptions);
                    if (deptPath && deptPath.length > 0) {
                        // 根据路径长度确定部门层级
                        if (deptPath.length >= 1) {
                            deptLevel1Id = parseInt(deptPath[0].key);
                        }
                        if (deptPath.length >= 2) {
                            deptLevel2Id = parseInt(deptPath[1].key);
                        }
                        if (deptPath.length >= 3) {
                            deptLevel3Id = parseInt(deptPath[2].key);
                        }
                        // 构建完整路径
                        deptFullPath = deptPath.map((dept: any) => dept.title).join('/');
                    }
                }

                // 构建请求数据
                const requestData = {
                    projectName: values.projectName,
                    approvalContent: values.approvalContent,
                    executeDate: values.executionDate ? dayjs(values.executionDate).toISOString() : new Date().toISOString(),
                    applicantId: user.id,
                    deptLevel1Id: deptLevel1Id || null,
                    deptLevel2Id: deptLevel2Id || null,
                    deptLevel3Id: deptLevel3Id || null,
                    deptFullPath: deptFullPath || null,
                };

                // 调用 API 保存数据
                const requestId = searchParams.get("id") as string;
                const data = await submitApprovalRequest(requestId, requestData);
                if (data) {
                    Message.success("保存成功");
                    // 重新获取数据并回填表单，保持当前页面
                    router.push('/approval');
                } else {
                    Message.error("保存失败");
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "保存失败";
                Message.error(errorMessage);
            } finally {
                setSaving(false);
            }
        }).catch((error) => {
            console.error("表单验证失败:", error);
        });
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
                    // 类似excel文件这种
                    // 比如application/vnd.ms-excel和application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
                    // 本身就带有.字符的，不能走下面的.jpg等文件扩展名判断处理
                    // 所以优先对比input的accept类型和文件对象的type值
                    return true;
                }
                if (new RegExp('\/\*').test(text)) {
                    // image/* 这种通配的形式处理
                    const regExp = new RegExp('\/.*$')
                    return fileType.replace(regExp, '') === text.replace(regExp, '');
                }
                if (new RegExp('\..*').test(text)) {
                    // .jpg 等后缀名
                    return text === `.${fileExtension && fileExtension.toLowerCase()}`;
                }
                return false;
            });
        }
        return !!file;
    }

    // 自定义上传函数：使用 OSS 预签名 URL
    const customRequest = async (option: any) => {
        const { onProgress, onError, onSuccess, file } = option;

        try {
            // 1. 获取预签名 URL（传递文件名和文件类型）
            const response = await fetch('/api/oss/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    filename: file.name,
                    contentType: file.type || 'application/octet-stream'
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.details || '获取上传地址失败');
            }

            const { uploadUrl, publicUrl, filename: uniqueFileName } = await response.json();

            // 2. 使用预签名 URL 上传文件到 OSS
            // 注意：Content-Type 必须与预签名 URL 生成时使用的一致
            const uploadContentType = file.type || 'application/octet-stream';
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': uploadContentType,
                },
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
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
                <Spin loading={loading || saving} style={{ width: '100%' }}>
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
                                onVisibleChange={handleTreeSelectVisibleChange}
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
                            />
                        </FormItem>


                        {!isReadOnly && (
                            <Row>
                                <Col span={24}>
                                    <FormItem>
                                        <Button type="primary" onClick={handleSave}>
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