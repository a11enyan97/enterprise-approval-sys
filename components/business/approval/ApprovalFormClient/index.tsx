"use client";

import { Form, Button, Grid } from "@arco-design/web-react";
import type { FormInstance } from "@arco-design/web-react";
import type { CascaderOption } from "@/types/departments";
import type { FormSchema } from "@/types/formBuilder";
import { renderFormField } from "./FormFieldRenderer";

const FormItem = Form.Item;
const { Row, Col } = Grid;

interface ApprovalFormProps {
  form: FormInstance;
  isReadOnly: boolean;
  departmentOptions: CascaderOption[];
  deptLoading?: boolean;
  customRequest: (option: any) => Promise<void>;
  saving?: boolean;
  onSave?: () => void;
  formSchema: FormSchema | null;
}

export default function ApprovalForm({
  form,
  isReadOnly,
  departmentOptions,
  deptLoading = false,
  customRequest,
  saving = false,
  onSave,
  formSchema,
}: ApprovalFormProps) {
  const formItemLayout = formSchema?.layout || {
    labelCol: { span: 2 },
    wrapperCol: { span: 8 },
  };

  return (
    <Form
      form={form}
      layout="horizontal"
      {...formItemLayout}
    >
      {formSchema?.fields.map((field) =>
        renderFormField({
          field,
          isReadOnly,
          departmentOptions,
          deptLoading,
          customRequest,
        })
      )}

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

