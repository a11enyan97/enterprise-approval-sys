"use client";

import { Form, Input, Select, TreeSelect, DatePicker, Button, Grid } from "@arco-design/web-react";
import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CollapsibleFilter from "@/components/business/CollapsibleFilter";
import type { CascaderOption } from "@/types/departments";

const FormItem = Form.Item;
const { Row, Col } = Grid;
const { RangePicker } = DatePicker;

interface ApprovalFilterClientProps {
  initialValues: {
    status?: string;
    deptLevel1Id?: string;
    deptLevel2Id?: string;
    deptLevel3Id?: string;
    approvalProject?: string;
    createTimeRange?: string;
    approvalTimeRange?: string;
  };
  departmentOptions: CascaderOption[];
}

export default function ApprovalFilterClient({
  initialValues,
  departmentOptions,
}: ApprovalFilterClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [deptLoading, setDeptLoading] = useState(false);

  // 审批状态选项
  const approvalStatusOptions = [
    { label: "草稿", value: "draft" },
    { label: "待审批", value: "pending" },
    { label: "已通过", value: "approved" },
    { label: "已拒绝", value: "rejected" },
  ];

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
      if (values.applicationDepartment) {
        // 查找部门路径
        const deptPath = findDeptPath(values.applicationDepartment, departmentOptions);
        if (deptPath) {
          if (deptPath.length >= 1) {
            params.set("deptLevel1Id", String(deptPath[0]));
          }
          if (deptPath.length >= 2) {
            params.set("deptLevel2Id", String(deptPath[1]));
          }
          if (deptPath.length >= 3) {
            params.set("deptLevel3Id", String(deptPath[2]));
          }
        } else {
          const deptIdNum = typeof values.applicationDepartment === 'string' 
            ? parseInt(values.applicationDepartment) 
            : values.applicationDepartment;
          params.set("deptLevel3Id", String(deptIdNum));
        }
      }
      if (values.approvalProject) {
        params.set("approvalProject", values.approvalProject);
      }
      
      // 重置到第一页
      params.set("page", "1");
      
      router.push(`/approval?${params.toString()}`);
    }).catch((error) => {
      console.error("表单验证失败:", error);
    });
  }, [form, router, searchParams, departmentOptions]);

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

  // 查找部门路径
  const findDeptPath = (deptId: string | number, options: CascaderOption[], path: number[] = []): number[] | null => {
    for (const option of options) {
      const optionValue = typeof option.key === 'string' ? parseInt(option.key) : (option.key as number);
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

  return (
    <div className="bg-white rounded-md p-4 mb-4">
      <CollapsibleFilter>
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: "16px" }}
          initialValues={{
            approvalStatus: initialValues.status,
            approvalProject: initialValues.approvalProject,
          }}
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

