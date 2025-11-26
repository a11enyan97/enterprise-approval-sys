"use client";

import { Form, Input, DatePicker, TreeSelect, Button, Grid, Upload, Message, Spin } from "@arco-design/web-react";
import { IconArrowLeft } from "@arco-design/web-react/icon";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useRouter, useSearchParams } from "next/navigation";
import { getApprovalDetail, submitApprovalRequest } from "@/lib/api/approval";
import { useDepartments } from "@/hooks/useDepartments";
import { useUserStore } from "@/store/userStore";
import type { ApprovalRequestItem } from "@/types/approval";

const FormItem = Form.Item;
const { Row, Col } = Grid;
const TextArea = Input.TextArea;

export default function ApprovalDetailPage({ params }: { params: Promise<{ pageType: string }> }) {
    const [pageType, setPageType] = useState<string>("");
    const [form] = Form.useForm();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState<boolean>(false);
    const [detailData, setDetailData] = useState<ApprovalRequestItem | null>(null);

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

    // 获取审批详情
    useEffect(() => {
        const id = searchParams.get("id");
        const isDetailsOrEdit = pageType === "details" || pageType === "edit";

        if (id && isDetailsOrEdit) {
            fetchApprovalDetail(id);
        }
    }, [pageType, searchParams]);

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

    // 获取审批详情
    const fetchApprovalDetail = async (id: string) => {
        try {
            setLoading(true);
            const data = await getApprovalDetail(id);
            setDetailData(data);

            // 处理附件数据
            const imageAttachments = data.attachments
                ?.filter(att => att.attachmentType === "image")
                .map(att => ({
                    uid: att.id,
                    url: att.filePath,
                    name: att.fileName,
                })) || [];

            const tableAttachments = data.attachments
                ?.filter(att => att.attachmentType === "table")
                .map(att => ({
                    uid: att.id,
                    url: att.filePath,
                    name: att.fileName,
                })) || [];

            // 填充表单数据
            // TreeSelect 使用单个值（string类型），优先使用三级部门ID，如果没有则使用二级，再没有则使用一级
            const deptId = data.deptLevel3Id || data.deptLevel2Id || data.deptLevel1Id;
            const deptValue = deptId ? String(deptId) : undefined;

            // 设置表单值
            form.setFieldsValue({
                projectName: data.projectName,
                approvalContent: data.approvalContent,
                executionDate: data.executeDate ? dayjs(data.executeDate) : undefined,
                applicationDepartment: deptValue,
                imageAttachments,
                tableAttachments,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "获取审批详情失败";
            Message.error(errorMessage);
            // 获取失败时返回列表页
            setTimeout(() => {
                router.push('/approval');
            }, 1500);
        } finally {
            setLoading(false);
        }
    };

    // 保存处理
    const handleSave = () => {
        if (!user) {
            Message.error("请先登录");
            return;
        }

        form.validate().then(async (values) => {
            try {
                setLoading(true);

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
                setLoading(false);
            }
        }).catch((error) => {
            console.error("表单验证失败:", error);
        });
    };

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
                <Spin loading={loading} style={{ width: '100%' }}>
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
                                action='/'
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
                                action='/'
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