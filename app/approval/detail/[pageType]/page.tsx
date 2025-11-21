"use client";

import { Form, Input, DatePicker, Button, Grid } from "@arco-design/web-react";
import { useState, useEffect } from "react";
import dayjs from "dayjs";

const FormItem = Form.Item;
const { Row, Col } = Grid;
const TextArea = Input.TextArea;

export default function ApprovalDetailPage({ params }: { params: Promise<{ pageType: string }> }) {
    const [pageType, setPageType] = useState<string>("");
    const [form] = Form.useForm();
    
    // 获取 params
    useEffect(() => {
        params.then((p) => setPageType(p.pageType));
    }, [params]);
    
    enum PageTypeEnum {
        add = '审核新增页',
        details = '审核详情页',
        edit = '审核编辑页',
    }
    
    // 判断是否为只读模式（详情页）
    const isReadOnly = pageType === 'details';
    
    // 表单初始值
    const initialValues = {
        projectName: "示例项目名称",
        approvalContent: "这是审批内容只读展示区域,限制300字内。长文本自动换行以保证可读性。",
        applicationDepartment: "A部门-B子部门-C团队",
        executionDate: dayjs("2025-11-18"),
    };
    
    // 保存处理
    const handleSave = () => {
        form.validate().then((values) => {
            console.log("保存数据:", values);
            // 这里可以调用 API 保存数据
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
                </div>
            </div>
            
            {/* 表单内容 */}
            <div className="bg-white rounded-md p-6">
                <Form
                    form={form}
                    initialValues={initialValues}
                    layout="vertical"
                    style={{ maxWidth: '800px' }}
                >
                    <FormItem 
                        label="审批项目" 
                        field="projectName"
                        rules={[{ required: true, message: '请输入审批项目' }]}
                    >
                        <Input 
                            placeholder="请输入审批项目" 
                            disabled={isReadOnly}
                            style={{ width: '100%' }}
                        />
                    </FormItem>
                    
                    <FormItem 
                        label="审批内容" 
                        field="approvalContent"
                        rules={[
                            { required: true, message: '请输入审批内容' },
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
                        label="申请部门" 
                        field="applicationDepartment"
                        rules={[{ required: true, message: '请选择申请部门' }]}
                    >
                        <Input 
                            placeholder="请选择申请部门" 
                            disabled={isReadOnly}
                            style={{ width: '100%' }}
                        />
                    </FormItem>
                    
                    <FormItem 
                        label="执行日期" 
                        field="executionDate"
                        rules={[{ required: true, message: '请选择执行日期' }]}
                    >
                        <DatePicker 
                            placeholder="请选择执行日期"
                            disabled={isReadOnly}
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                        />
                    </FormItem>
                    
                    {!isReadOnly && (
                        <FormItem>
                            <Button type="primary" onClick={handleSave} style={{ marginTop: '8px' }}>
                                保存
                            </Button>
                        </FormItem>
                    )}
                </Form>
            </div>
        </div>
    );
}   