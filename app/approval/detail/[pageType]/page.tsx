"use client";

import { Form, Input, DatePicker, Cascader, Button, Grid, Upload, Message } from "@arco-design/web-react";
import { IconArrowLeft } from "@arco-design/web-react/icon";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { log } from "console";

const FormItem = Form.Item;
const { Row, Col } = Grid;
const TextArea = Input.TextArea;

export default function ApprovalDetailPage({ params }: { params: Promise<{ pageType: string }> }) {
    const [pageType, setPageType] = useState<string>("");
    const [form] = Form.useForm();
    const router = useRouter();
    const formItemLayout = {
        labelCol: {
            span: 1,
        },
        wrapperCol: {
            span: 8,
        },
    };

    // 获取 params
    useEffect(() => {
        params.then((p) => setPageType(p.pageType));
    }, [params]);

    enum PageTypeEnum {
        add = '审核新增页',
        details = '审核详情页',
        edit = '审核编辑页',
    }
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

    // 判断是否为只读模式（详情页）
    const isReadOnly = pageType === 'details';

    // 表单初始值
    // const initialValues = {
    //     projectName: "示例项目名称",
    //     approvalContent: "这是审批内容只读展示区域,限制300字内。长文本自动换行以保证可读性。",
    //     applicationDepartment: "A部门-B子部门-C团队",
    //     executionDate: dayjs("2025-11-18"),
    // };

    // 保存处理
    const handleSave = () => {
        form.validate().then((values) => {
            console.log("保存数据:", values);
            // 这里可以调用 API 保存数据
        });
    };

    // 返回处理
    const handleBack = () => {
        router.push('/approval');
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
                    <Button type="text" onClick={handleBack}>
                        <IconArrowLeft />
                        返回
                    </Button>
                </div>
            </div>

            {/* 表单内容 */}
            <div className="bg-white rounded-md p-6">
                <Form
                    form={form}
                    // initialValues={initialValues}
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
                        <Cascader
                            options={departmentOptions}
                            placeholder="请选择部门"
                            allowClear
                            style={{ width: "100%" }}
                            disabled={isReadOnly}
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
                        initialValue={[
                            {
                                uid: '-1',
                                url: '//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/e278888093bef8910e829486fb45dd69.png~tplv-uwbnlip3yd-webp.webp',
                                name: '20200717',
                            },
                        ]}
                    >
                        <Upload
                            multiple
                            imagePreview
                            limit ={3}
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
            </div>
        </div>
    );
}   