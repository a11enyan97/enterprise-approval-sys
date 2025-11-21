"use client";

import { Form, Input, Select, Cascader, DatePicker, Button, Grid, Table, TableColumnProps, Avatar, Dropdown, Menu } from "@arco-design/web-react";
import { IconPlus, IconCaretDown } from "@arco-design/web-react/icon";
import React, { useState } from "react";
import dayjs from "dayjs";
import CollapsibleFilter from "./components/CollapsibleFilter";

const FormItem = Form.Item;
const { Row, Col } = Grid;
const { RangePicker } = DatePicker;

export default function ApprovalPage() {
    const [form] = Form.useForm();
    
    // 身份列表
    const roles = [
        { label: "申请人", value: "applicant" },
        { label: "审批人", value: "approver" }
    ];
    
    // 当前选中的身份
    const [currentRole, setCurrentRole] = useState(roles[0].value);

    // 审批状态选项
    const approvalStatusOptions = [
        { label: "待审批", value: "pending" },
        { label: "已通过", value: "approved" },
        { label: "已拒绝", value: "rejected" },
        { label: "已撤回", value: "withdrawn" },
    ];

    // 三级部门级联数据（示例数据）
    const departmentOptions = [
        {
            label: "A部门",
            value: "deptA",
            children: [
                {
                    label: "B子部门",
                    value: "subDeptB",
                    children: [
                        { label: "C团队", value: "teamC" },
                        { label: "D团队", value: "teamD" },
                    ],
                },
            ],
        },
    ];
    // 表格列配置
    const columns: TableColumnProps<any>[] = [
        {
            title: '审核状态',
            dataIndex: 'status',
            align: 'center',
        },
        {
            title: '创建时间',
            dataIndex: 'create_time',
            align: 'center',
        },
        {
            title: '审批时间',
            dataIndex: 'approval_time',
            align: 'center',
            placeholder: '--'
        },
        {
            title: '审批项目',
            dataIndex: 'project_name',
            align: 'center',
            ellipsis: true,
        },
        {
            title: '操作',
            dataIndex: 'action',
            align: 'center',
            render: (text: string, record: any) => (
                <div className="flex items-center justify-center gap-2">
                    <Button type="text" size="small" onClick={() => handleView(record)}>查看</Button>
                    <Button type="text" size="small" onClick={() => handleEdit(record)}>修改</Button>
                </div>
            ),
        }
    ];
    // 表模拟格数据
    const data = [
        {
            key: '1',
            status: '待审批',
            create_time: '2025-01-01 12:00:00',
            approval_time: '2025-01-01 12:00:00',
            project_name: '项目1',
        },
        {
            key: '2',
            status: '审批通过',
            create_time: '2025-01-01 12:00:00',
            approval_time: '2025-01-01 12:00:00',
            project_name: '项目2',
        },
        {
            key: '3',
            status: '拒绝',
            create_time: '2025-01-01 12:00:00',
            approval_time: '2025-01-01 12:00:00',
            project_name: '项目3',
        },
    ];

    // 初始化表单默认值
    // const initialValues = {
    //     approvalStatus: "pending",
    //     createTimeRange: [
    //         dayjs().startOf("day").format("YYYY-MM-DD HH:mm:ss"),
    //         dayjs().endOf("day").format("YYYY-MM-DD HH:mm:ss"),
    //     ],
    //     approvalTimeRange: [],
    //     approvalProject: "",
    //     applicationDepartment: ["deptA", "subDeptB", "teamC"],
    // };

    // 查询处理
    const handleQuery = () => {
        form.validate().then((values) => {
            console.log("查询参数:", values);
            // 这里可以调用 API 进行查询
        });
    };

    // 清空已选
    const handleClear = () => {
        form.resetFields();
        // form.setFieldsValue(initialValues);
    };

    // 新建审批
    const handleCreate = () => {
        console.log("新建审批");
    };
    
    // 查看审批
    const handleView = (record: any) => {
        console.log("查看审批:", record);
    };
    
    // 修改审批
    const handleEdit = (record: any) => {
        console.log("修改审批:", record);
    };
    // 身份切换处理
    const handleRoleChange = (roleValue: string) => {
        setCurrentRole(roleValue);
        console.log("切换身份为:", roleValue);
        // 这里可以添加身份切换后的逻辑，比如刷新数据、更新权限等
    };
    
    // 下拉菜单
    const dropList = (
        <Menu>
            {roles.map((role) => (
                <Menu.Item
                    key={role.value}
                    onClick={() => handleRoleChange(role.value)}
                    style={{
                        backgroundColor: currentRole === role.value ? '#e6f4ff' : 'transparent',
                        color: currentRole === role.value ? '#1890ff' : '#000',
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
                                    {roles.find(r => r.value === currentRole)?.label.charAt(0)}
                                </Avatar>
                            <span className="text-sm text-gray-700 font-medium">
                                {roles.find(r => r.value === currentRole)?.label}
                                <IconCaretDown style={{marginLeft: '4px', display: 'inline-block'}}/>
                            </span>
                        </div>
                    </Dropdown>
                </div>
            </div>
            
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
                                    <Cascader
                                        options={departmentOptions}
                                        placeholder="请选择部门"
                                        allowClear
                                        style={{ width: "100%" }}
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
            <div className="bg-white rounded-md p-4 mt-4">
                <div className="text-lg font-medium mb-4">
                    <Button type='primary' icon={<IconPlus />} style={{ width: '100px' }} onClick={handleCreate}>新建</Button>
                </div>
                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        data={data}
                        stripe
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
        </div>
    );
}

