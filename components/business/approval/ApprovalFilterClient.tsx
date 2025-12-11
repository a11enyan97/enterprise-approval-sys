"use client";

import { Form, Input, Select, TreeSelect, DatePicker, Button, Grid } from "@arco-design/web-react";
import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CollapsibleFilter from "@/components/business/CollapsibleFilter";
import type { CascaderOption } from "@/types/departments";
import { APPROVAL_STATUS_OPTIONS } from "@/constants/approvalConfig";

const FormItem = Form.Item;
const { Row, Col } = Grid;
const { RangePicker } = DatePicker;

interface ApprovalFilterClientProps {
  departmentOptions: CascaderOption[];
}

export default function ApprovalFilterClient({
  departmentOptions,
}: ApprovalFilterClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [deptLoading, setDeptLoading] = useState(false);

  // 从 URL 获取筛选参数作为初始值
  const createTimeStart = searchParams.get("createTimeStart");
  const createTimeEnd = searchParams.get("createTimeEnd");
  const approvalTimeStart = searchParams.get("approvalTimeStart");
  const approvalTimeEnd = searchParams.get("approvalTimeEnd");

  const initialValues = {
    status: searchParams.get("status") || undefined,
    deptId: searchParams.get("deptId") || undefined,
    projectName: searchParams.get("projectName") || undefined,
    createTimeRange: createTimeStart && createTimeEnd
      ? [new Date(createTimeStart), new Date(createTimeEnd)]
      : undefined,
    approvalTimeRange: approvalTimeStart && approvalTimeEnd
      ? [new Date(approvalTimeStart), new Date(approvalTimeEnd)]
      : undefined,
  };

  // 查询处理 - 使用 URL 搜索参数
  const handleQuery = useCallback(() => {
    form.validate().then((values) => {
      const params = new URLSearchParams();
      
      // 保留分页参数
      const currentPage = searchParams.get("page") || "1";
      const currentPageSize = searchParams.get("pageSize") || "10";
      params.set("page", currentPage);
      params.set("pageSize", currentPageSize);
      
      // 添加筛选参数
      if (values.approvalStatus) {
        params.set("status", values.approvalStatus);
      }
      
      // 部门ID：只传递选中的部门ID，不再传递三级部门ID
      if (values.applicationDepartment) {
        const deptId = typeof values.applicationDepartment === 'string' 
          ? parseInt(values.applicationDepartment) 
          : values.applicationDepartment;
        if (!isNaN(deptId)) {
          params.set("deptId", String(deptId));
        }
      }
      
      // 项目名称
      if (values.approvalProject) {
        params.set("projectName", values.approvalProject);
      }
      
      // 创建时间范围（Arco Design RangePicker 返回的是 Date 对象数组）
      if (values.createTimeRange && Array.isArray(values.createTimeRange) && values.createTimeRange.length === 2) {
        const [start, end] = values.createTimeRange;
        if (start) {
          // 如果是 Date 对象，直接转换；如果是字符串，先转换为 Date
          const startDate = start instanceof Date ? start : new Date(start);
          params.set("createTimeStart", startDate.toISOString());
        }
        if (end) {
          const endDate = end instanceof Date ? end : new Date(end);
          params.set("createTimeEnd", endDate.toISOString());
        }
      }
      
      // 审批时间范围（Arco Design RangePicker 返回的是 Date 对象数组）
      if (values.approvalTimeRange && Array.isArray(values.approvalTimeRange) && values.approvalTimeRange.length === 2) {
        const [start, end] = values.approvalTimeRange;
        if (start) {
          const startDate = start instanceof Date ? start : new Date(start);
          params.set("approvalTimeStart", startDate.toISOString());
        }
        if (end) {
          const endDate = end instanceof Date ? end : new Date(end);
          params.set("approvalTimeEnd", endDate.toISOString());
        }
      }
      
      // 重置到第一页
      params.set("page", "1");
      
      router.push(`/approval?${params.toString()}`);
    }).catch((error) => {
      console.error("表单验证失败:", error);
    });
  }, [form, router, searchParams]);

  // 清空已选
  const handleClear = useCallback(() => {
    form.resetFields();
    // 只保留分页参数
    const params = new URLSearchParams();
    const currentPage = searchParams.get("page") || "1";
    const currentPageSize = searchParams.get("pageSize") || "10";
    params.set("page", currentPage);
    params.set("pageSize", currentPageSize);
    router.push(`/approval?${params.toString()}`);
  }, [form, router, searchParams]);


  return (
    <div className="bg-white rounded-md p-4 mb-4">
      <CollapsibleFilter>
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: "16px" }}
          initialValues={{
            approvalStatus: initialValues.status,
            approvalProject: initialValues.projectName,
            applicationDepartment: initialValues.deptId,
            createTimeRange: initialValues.createTimeRange,
            approvalTimeRange: initialValues.approvalTimeRange,
          }}
        >
          <Row gutter={16}>
            <Col span={6}>
              <FormItem label="审批状态" field="approvalStatus">
                <Select placeholder="请选择审批状态" allowClear>
                  {APPROVAL_STATUS_OPTIONS.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </FormItem>
            </Col>
            <Col span={9}>
              <FormItem label="创建时间" field="createTimeRange">
                <RangePicker
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: "100%" }}
                />
              </FormItem>
            </Col>
            <Col span={9}>
              <FormItem label="审批时间" field="approvalTimeRange">
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
              <FormItem label="审批项目" field="approvalProject">
                <Input placeholder="请输入审批项目关键字" allowClear />
              </FormItem>
            </Col>
            <Col span={6}>
              <FormItem label="申请部门" field="applicationDepartment">
                <TreeSelect
                  treeData={departmentOptions}
                  placeholder="请选择部门"
                  allowClear
                  style={{ width: "100%" }}
                  loading={deptLoading}
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
  );
}

