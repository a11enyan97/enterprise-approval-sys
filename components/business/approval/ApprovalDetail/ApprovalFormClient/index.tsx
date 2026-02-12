"use client";

import { Form, Button, Grid } from "@arco-design/web-react";
import type { FormInstance, UploadProps } from "@arco-design/web-react";
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
  /** 人员树数据（供 userPicker 使用） */
  userOptions?: CascaderOption[];
  /** 人员树加载状态 */
  userLoading?: boolean;
  customRequest: NonNullable<UploadProps['customRequest']>;
  saving?: boolean;
  onSave?: () => void;
  formSchema: FormSchema | null;
}

export default function ApprovalForm({
  form,
  isReadOnly,
  departmentOptions,
  deptLoading = false,
  userOptions = [],
  userLoading = false,
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
          userOptions,
          userLoading,
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

