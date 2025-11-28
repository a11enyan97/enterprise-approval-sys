"use client";

import { Form, Input, Select, TreeSelect, DatePicker, Button, Grid, Table, Avatar, Dropdown, Menu, Message, Spin } from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import { IconPlus, IconCaretDown } from "@arco-design/web-react/icon";
import { useState, useEffect } from "react";
import CollapsibleFilter from "@/components/business/CollapsibleFilter";
import ConfirmModal from "@/components/business/ConfirmModal";
import { useRouter } from "next/navigation";
import { useApprovalList } from "@/hooks/useApprovalList";
import { useDepartments } from "@/hooks/useDepartments";
import { submitApprovalRequest, approveOrRejectApprovalRequest, deleteApprovalRequest } from "@/utils/api/approval";
import { useUserStore } from "@/store/userStore";
import type { ApprovalRequestItem, ApprovalStatus } from "@/types/approval";
import dayjs from "dayjs";

const FormItem = Form.Item;
const { Row, Col } = Grid;
const { RangePicker } = DatePicker;

/**
 * 审批状态映射
 */
const getStatusLabel = (status: ApprovalStatus | string): string => {
    const statusMap: Record<string, string> = {
        draft: "草稿",
        pending: "待审批",
        approved: "已通过",
        rejected: "已拒绝",
    };
    return statusMap[status] || status;
};

/**
 * 格式化日期时间
 */
const formatDateTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "--";
    return dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss");
};

export default function ApprovalPage() {
    const [form] = Form.useForm();
    const router = useRouter();
    
    // 分页和查询参数
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [queryParams, setQueryParams] = useState<{
        status?: string;
        applicantId?: number;
        deptLevel1Id?: number;
        deptLevel2Id?: number;
        deptLevel3Id?: number;
    }>({});
    
    // 提交加载状态
    const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
    
    // 审批加载状态
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    
    // 删除加载状态
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    
    // 确认弹窗状态
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [pendingRecord, setPendingRecord] = useState<ApprovalRequestItem | null>(null);
    
    // 审批弹窗状态
    const [approvalModalVisible, setApprovalModalVisible] = useState(false);
    const [approvalRecord, setApprovalRecord] = useState<ApprovalRequestItem | null>(null);
    const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
    
    // 删除弹窗状态
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [deleteRecord, setDeleteRecord] = useState<ApprovalRequestItem | null>(null);

    // 从全局状态获取用户信息（真实逻辑）
    const { user, isApplicant, isApprover, switchToApplicant, switchToApprover } = useUserStore();

    // 审批状态选项
    const approvalStatusOptions = [
        { label: "草稿", value: "draft" },
        { label: "待审批", value: "pending" },
        { label: "已通过", value: "approved" },
        { label: "已拒绝", value: "rejected" },
    ];

    // 使用 Hook 获取数据
    const { data, loading, error, refetch } = useApprovalList({
        page,
        pageSize,
        ...queryParams,
    });

    // 懒加载部门数据
    const { options: departmentOptions, loading: deptLoading, refetch: refetchDepts } = useDepartments();
    
    // 当树形选择器展开时加载部门数据
    const handleTreeSelectVisibleChange = (visible: boolean) => {
        if (visible && departmentOptions.length === 0 && !deptLoading) {
            refetchDepts();
        }
    };
    // 表格列配置
    const columns: TableColumnProps<ApprovalRequestItem>[] = [
        {
            title: '审核状态',
            dataIndex: 'currentStatus',
            align: 'center',
            render: (status: ApprovalStatus) => getStatusLabel(status),
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            align: 'center',
            render: (date: string) => formatDateTime(date),
        },
        {
            title: '提交时间',
            dataIndex: 'submittedAt',
            align: 'center',
            render: (date: string | null) => formatDateTime(date),
        },
        {
            title: '审批时间',
            dataIndex: 'completedAt',
            align: 'center',
            render: (date: string | null) => formatDateTime(date),
        },
        {
            title: '审批项目',
            dataIndex: 'projectName',
            align: 'center',
            ellipsis: true,
        },
        {
            title: '申请人',
            dataIndex: 'applicant',
            align: 'center',
            render: (applicant: { realName: string }) => applicant?.realName || "--",
        },
        {
            title: '操作',
            dataIndex: 'action',
            align: 'center',
            render: (text: string, record: ApprovalRequestItem) => {
                const isDraft = record.currentStatus === "draft";
                const isPending = record.currentStatus === "pending";
                const isOwnRecord = user && record.applicantId === user.id;
                
                return (
                    <div className="flex items-center justify-center gap-2">
                        <Button type="text" size="small" onClick={() => handleView(record)}>查看</Button>
                        
                        {/* 申请者权限：只能操作自己创建的草稿状态申请 */}
                        {isApplicant() && isDraft && isOwnRecord && (
                            <>
                                <Button type="text" size="small" onClick={() => handleEdit(record)}>修改</Button>
                                <Button 
                                    type="text" 
                                    size="small" 
                                    onClick={() => handleSubmit(record)}
                                    loading={submittingIds.has(record.id)}
                                >
                                    提交
                                </Button>
                                <Button 
                                    type="text" 
                                    size="small" 
                                    status="danger"
                                    onClick={() => handleDelete(record)}
                                    loading={deletingIds.has(record.id)}
                                >
                                    删除
                                </Button>
                            </>
                        )}
                        
                        {/* 审批者权限：只能审批 pending 状态的申请 */}
                        {isApprover() && isPending && (
                            <>
                                <Button 
                                    type="text" 
                                    size="small" 
                                    status="success"
                                    onClick={() => handleApprove(record)}
                                    loading={approvingIds.has(record.id)}
                                >
                                    同意
                                </Button>
                                <Button 
                                    type="text" 
                                    size="small" 
                                    status="danger"
                                    onClick={() => handleReject(record)}
                                    loading={approvingIds.has(record.id)}
                                >
                                    拒绝
                                </Button>
                            </>
                        )}
                    </div>
                );
            },
        }
    ];

    // 查找部门在树中的路径（用于确定部门层级）
    const findDeptPath = (deptId: string | number, options: any[], path: number[] = []): number[] | null => {
        for (const option of options) {
            const optionValue = typeof option.value === 'string' ? parseInt(option.value) : option.value;
            const currentPath = [...path, optionValue];
            const compareValue = typeof deptId === 'string' ? parseInt(deptId) : deptId;
            if (optionValue === compareValue) {
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

    // 查询处理
    const handleQuery = () => {
        form.validate().then((values) => {
            // 构建查询参数
            const params: any = {};
            if (values.approvalStatus) {
                params.status = values.approvalStatus;
            }
            // 处理部门筛选（TreeSelect 返回的是单个部门ID，string类型）
            if (values.applicationDepartment) {
                const deptId = values.applicationDepartment;
                // 查找该部门在树中的路径，确定是几级部门
                const deptPath = findDeptPath(deptId, departmentOptions);
                if (deptPath) {
                    if (deptPath.length >= 1) {
                        params.deptLevel1Id = deptPath[0];
                    }
                    if (deptPath.length >= 2) {
                        params.deptLevel2Id = deptPath[1];
                    }
                    if (deptPath.length >= 3) {
                        params.deptLevel3Id = deptPath[2];
                    }
                } else {
                    // 如果找不到路径，直接使用该ID作为三级部门（转换为number）
                    const deptIdNum = typeof deptId === 'string' ? parseInt(deptId) : deptId;
                    params.deptLevel3Id = deptIdNum;
                }
            }
            // 如果有申请人ID筛选，可以在这里添加
            // if (values.applicantId) {
            //     params.applicantId = values.applicantId;
            // }
            
            setQueryParams(params);
            setPage(1); // 重置到第一页
        }).catch((error) => {
            console.error("表单验证失败:", error);
        });
    };

    // 清空已选
    const handleClear = () => {
        form.resetFields();
        setQueryParams({});
        setPage(1);
    };

    // 分页变化处理
    const handlePageChange = (currentPage: number, currentPageSize?: number) => {
        setPage(currentPage);
        if (currentPageSize) {
            setPageSize(currentPageSize);
        }
    };

    // 新建审批
    const handleCreate = () => {
        router.push('/approval/info/add');
        console.log("新建审批");
    };
    
    // 查看审批
    const handleView = (record: ApprovalRequestItem) => {
        router.push(`/approval/info/details?id=${record.id}`);
    };
    
    // 修改审批
    const handleEdit = (record: ApprovalRequestItem) => {
        router.push(`/approval/info/edit?id=${record.id}`);
    };
    
    // 提交审批 - 显示确认弹窗
    const handleSubmit = (record: ApprovalRequestItem) => {
        if (submittingIds.has(record.id)) {
            return; // 防止重复提交
        }
        setPendingRecord(record);
        setConfirmVisible(true);
    };

    // 删除审批 - 显示确认弹窗
    const handleDelete = (record: ApprovalRequestItem) => {
        if (!user) {
            Message.error("请先登录");
            return;
        }
        setDeleteRecord(record);
        setDeleteConfirmVisible(true);
    };
    
    // 确认提交
    const handleConfirmSubmit = async () => {
        if (!pendingRecord) return;
        
        try {
            setSubmittingIds((prev) => new Set(prev).add(pendingRecord.id));
            await submitApprovalRequest(pendingRecord.id, {
                currentStatus: "pending",
            });
            Message.success("提交成功");
            setConfirmVisible(false);
            setPendingRecord(null);
            // 刷新列表
            await refetch();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "提交失败";
            Message.error(errorMessage);
        } finally {
            setSubmittingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(pendingRecord.id);
                return newSet;
            });
        }
    };
    
    // 取消提交
    const handleCancelSubmit = () => {
        setConfirmVisible(false);
        setPendingRecord(null);
    };
    
    // 审批处理（同意）
    const handleApprove = (record: ApprovalRequestItem) => {
        if (!user) {
            Message.error("请先登录");
            return;
        }
        setApprovalRecord(record);
        setApprovalAction("approve");
        setApprovalModalVisible(true);
    };
    
    // 审批处理（拒绝）
    const handleReject = (record: ApprovalRequestItem) => {
        if (!user) {
            Message.error("请先登录");
            return;
        }
        setApprovalRecord(record);
        setApprovalAction("reject");
        setApprovalModalVisible(true);
    };
    
    // 确认审批
    const handleConfirmApproval = async () => {
        if (!approvalRecord || !approvalAction || !user) {
            return;
        }
        
        try {
            setApprovingIds((prev) => new Set(prev).add(approvalRecord.id));
            await approveOrRejectApprovalRequest(
                approvalRecord.id,
                approvalAction,
                user.id
            );
            Message.success(approvalAction === "approve" ? "审批通过" : "审批拒绝");
            setApprovalModalVisible(false);
            setApprovalRecord(null);
            setApprovalAction(null);
            // 刷新列表
            await refetch();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "审批操作失败";
            Message.error(errorMessage);
        } finally {
            setApprovingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(approvalRecord.id);
                return newSet;
            });
        }
    };
    
    // 取消审批
    const handleCancelApproval = () => {
        setApprovalModalVisible(false);
        setApprovalRecord(null);
        setApprovalAction(null);
    };
    
    // 确认删除
    const handleConfirmDelete = async () => {
        if (!deleteRecord) return;
        const recordId = deleteRecord.id;
        
        try {
            setDeletingIds((prev) => new Set(prev).add(recordId));
            await deleteApprovalRequest(recordId);
            Message.success("删除成功");
            setDeleteConfirmVisible(false);
            setDeleteRecord(null);
            await refetch();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "删除失败";
            Message.error(errorMessage);
        } finally {
            setDeletingIds((prev) => {
                const newSet = new Set(prev);
                newSet.delete(recordId);
                return newSet;
            });
        }
    };
    
    // 取消删除
    const handleCancelDelete = () => {
        setDeleteConfirmVisible(false);
        setDeleteRecord(null);
    };
    
    // 身份切换处理（使用 store 中的方法）
    const handleRoleChange = (roleValue: string) => {
        if (roleValue === "applicant") {
            switchToApplicant();
        } else if (roleValue === "approver") {
            switchToApprover();
        }
        // 切换身份后刷新数据
        refetch();
    };

    // 错误处理
    useEffect(() => {
        if (error) {
            Message.error(error.message || "获取数据失败");
        }
    }, [error]);
    
    // 下拉菜单（用于测试时切换角色）
    const roles = [
        { label: "申请人", value: "applicant" },
        { label: "审批人", value: "approver" }
    ];
    
    const dropList = (
        <Menu>
            {roles.map((role) => (
                <Menu.Item
                    key={role.value}
                    onClick={() => handleRoleChange(role.value)}
                    style={{
                        backgroundColor: user?.role === role.value ? '#e6f4ff' : 'transparent',
                        color: user?.role === role.value ? '#1890ff' : '#000',
                    }}
                >
                    {role.label}
                </Menu.Item>
            ))}
        </Menu>
    );

    return (
        <div className="p-6 bg-zinc-50 min-h-screen">
            {/* 页面头部 */}
            <div className="bg-white rounded-md p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-800 m-0">审批查询页</div>
                    <Dropdown droplist={dropList} position="br" trigger="click">
                        <div className="flex items-center gap-3 mr-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                                <Avatar size={32} style={{ backgroundColor: '#3370ff' }}>
                                    {user?.realName?.charAt(0) || "用"}
                                </Avatar>
                            <span className="text-sm text-gray-700 font-medium">
                                {user?.realName || "用户"} ({isApplicant() ? "申请人" : "审批人"})
                                <IconCaretDown style={{marginLeft: '4px', display: 'inline-block'}}/>
                            </span>
                        </div>
                    </Dropdown>
                </div>
            </div>
            {/* 筛选区 */}
            <div className="bg-white rounded-md p-4">
                <CollapsibleFilter>
                    <Form
                        form={form}
                        // initialValues={initialValues}
                        layout="vertical"
                        style={{ marginTop: "16px" }}
                    >
                        <Row gutter={16}>
                            <Col span={6}>
                                <FormItem label="审批状态" field="approvalStatus">
                                    <Select placeholder="请选择审批状态" allowClear>
                                        {approvalStatusOptions.map((option) => (
                                            <Select.Option key={option.value} value={option.value}>
                                                {option.label}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </FormItem>
                            </Col>
                            <Col span={9}>
                                <FormItem
                                    label="创建时间"
                                    field="createTimeRange"
                                >
                                    <RangePicker
                                        showTime
                                        format="YYYY-MM-DD HH:mm:ss"
                                        style={{ width: "100%" }}
                                    />
                                </FormItem>
                            </Col>
                            <Col span={9}>
                                <FormItem
                                    label="审批时间"
                                    field="approvalTimeRange"
                                >
                                    <RangePicker
                                        showTime
                                        format="YYYY-MM-DD HH:mm:ss"
                                        style={{ width: "100%" }}
                                    />
                                </FormItem>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={6}>
                                <FormItem
                                    label="审批项目"
                                    field="approvalProject"
                                >
                                    <Input placeholder="请输入审批项目关键字" allowClear />
                                </FormItem>
                            </Col>
                            <Col span={6}>
                                <FormItem
                                    label="申请部门"
                                    field="applicationDepartment"
                                >
                                    <TreeSelect
                                        treeData={departmentOptions}
                                        placeholder="请选择部门"
                                        allowClear
                                        style={{ width: "100%" }}
                                        loading={deptLoading}
                                        onVisibleChange={handleTreeSelectVisibleChange}
                                        fieldNames={{
                                            title: "title",
                                            key: "key",
                                            children: "children",
                                        }}
                                    />
                                </FormItem>
                            </Col>
                            <Col span={12}>
                                <FormItem label=" " style={{ marginTop: "30px" }}>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <Button type="primary" onClick={handleQuery}>
                                            查询
                                        </Button>
                                        <Button onClick={handleClear}>重置</Button>
                                    </div>
                                </FormItem>
                            </Col>
                        </Row>
                    </Form>
                </CollapsibleFilter>
            </div>
            {/* 表格区 */}
            <div className="bg-white rounded-md p-4 mt-4">
                <div className="text-lg font-medium mb-4">
                    {/* 只有申请者才能新建 */}
                    {isApplicant() && (
                        <Button type='primary' icon={<IconPlus />} style={{ width: '100px' }} onClick={handleCreate}>新建</Button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <Spin loading={loading} style={{ width: '100%' }}>
                        <Table
                            columns={columns}
                            data={data?.data || []}
                            stripe
                            style={{ width: '100%' }}
                            pagination={{
                                current: page,
                                pageSize: pageSize,
                                total: data?.total || 0,
                                showTotal: true,
                                showJumper: true,
                                onChange: handlePageChange,
                                onPageSizeChange: handlePageChange,
                            }}
                            noDataElement={error ? "加载失败，请重试" : "暂无数据"}
                        />
                    </Spin>
                </div>
            </div>
            
            {/* 确认提交弹窗 */}
            <ConfirmModal
                type="submit"
                title="确认提交"
                visible={confirmVisible}
                projectName={pendingRecord?.projectName || ""}
                okText="确认提交"
                cancelText="取消"
                okButtonStatus="default"
                confirmLoading={pendingRecord ? submittingIds.has(pendingRecord.id) : false}
                onOk={handleConfirmSubmit}
                onCancel={handleCancelSubmit}
            />
            
            {/* 删除确认弹窗 */}
            <ConfirmModal
                type="delete"
                title="确认删除"
                visible={deleteConfirmVisible}
                projectName={deleteRecord?.projectName || ""}
                okText="确认删除"
                cancelText="取消"
                okButtonStatus="danger"
                confirmLoading={deleteRecord ? deletingIds.has(deleteRecord.id) : false}
                onOk={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
            
            {/* 审批确认弹窗 */}
            <ConfirmModal
                type="approve"
                title={approvalAction === "approve" ? "确认同意" : "确认拒绝"}
                visible={approvalModalVisible}
                projectName={approvalRecord?.projectName || ""}
                okText={approvalAction === "approve" ? "确认同意" : "确认拒绝"}
                cancelText="取消"
                okButtonStatus={approvalAction === "approve" ? "success" : "danger"}
                confirmLoading={approvalRecord ? approvingIds.has(approvalRecord.id) : false}
                approvalAction={approvalAction || undefined}
                onOk={handleConfirmApproval}
                onCancel={handleCancelApproval}
            />
        </div>
    );
}

