"use client";

import { Form, Input, Select, TreeSelect, DatePicker, Button, Grid } from "@arco-design/web-react";
import CollapsibleFilter from "@/components/common/CollapsibleFilter";
import type { CascaderOption } from "@/types/departments";
import { APPROVAL_STATUS_OPTIONS } from "@/constants/approvalConfig";
import { useApprovalFilterLogic } from "@/hooks/business/approval/useApprovalFilterLogic";

const FormItem = Form.Item;
const { Row, Col } = Grid;
const { RangePicker } = DatePicker;

interface ApprovalFilterClientProps {
  departmentOptions: CascaderOption[];
}

export default function ApprovalFilterClient({
  departmentOptions,
}: ApprovalFilterClientProps) {
  
  const { state, methods } = useApprovalFilterLogic();
  const { form, initialValues } = state;
  const { handleQuery, handleClear } = methods;

  return (
    <div className="bg-white rounded-md p-4 mb-4">
      <CollapsibleFilter>
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: "16px" }}
          initialValues={initialValues}
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
