"use client";

import { Form, Input, DatePicker, TreeSelect, Button, Grid, Upload } from "@arco-design/web-react";
import type { FormInstance } from "@arco-design/web-react";
import type { CascaderOption } from "@/types/departments";

const FormItem = Form.Item;
const { Row, Col } = Grid;
const TextArea = Input.TextArea;

interface ApprovalFormProps {
  form: FormInstance;
  isReadOnly: boolean;
  departmentOptions: CascaderOption[];
  deptLoading?: boolean;
  customRequest: (option: any) => Promise<void>;
  saving?: boolean;
  onSave?: () => void;
  formItemLayout?: {
    labelCol: { span: number };
    wrapperCol: { span: number };
  };
}

export default function ApprovalForm({
  form,
  isReadOnly,
  departmentOptions,
  deptLoading = false,
  customRequest,
  saving = false,
  onSave,
  formItemLayout = {
    labelCol: { span: 2 },
    wrapperCol: { span: 8 },
  },
}: ApprovalFormProps) {
  return (
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

      {!isReadOnly && onSave && (
        <Row>
          <Col span={24}>
            <FormItem>
              <Button type="primary" onClick={onSave} loading={saving}>
                保存
              </Button>
            </FormItem>
          </Col>
        </Row>
      )}
    </Form>
  );
}

