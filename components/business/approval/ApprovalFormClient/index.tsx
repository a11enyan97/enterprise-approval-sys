"use client";

import { useMemo } from "react";
import { Form, Button, Grid } from "@arco-design/web-react";
import type { FormInstance } from "@arco-design/web-react";
import dayjs from "dayjs";
import type { CascaderOption } from "@/types/departments";
import type { FormSchema } from "@/types/formBuilder";
import { isFieldVisible, isFirstLevelDepartment } from "@/utils/formLinkageUtils";
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
  // 复杂表单联动：监听参与联动的字段
  const watched = Form.useWatch(
    ["projectName", "applicationDepartment"],
    form
  ) as Record<string, unknown> | undefined;
  const formValues = watched ?? {};

  // 根据联动规则过滤出当前应显示的字段（避免循环更新，仅依赖监听字段）
  const visibleFields = useMemo(() => {
    if (!formSchema?.fields) return [];
    return formSchema.fields.filter((f) => isFieldVisible(f, formValues));
  }, [formSchema?.fields, formValues.projectName, formValues.applicationDepartment]);

  // 部门 → 执行日期联动：选一层部门时，执行日期仅允许未来 7 天
  const linkagePropsByKey = useMemo(() => {
    const res: Record<string, Record<string, unknown>> = {};
    const appDept = formValues.applicationDepartment as string | undefined;
    if (isFirstLevelDepartment(appDept, departmentOptions)) {
      const today = dayjs().startOf("day");
      const maxDate = today.add(7, "day");
      res.executionDate = {
        disabledDate: (current: dayjs.Dayjs | Date) => {
          const d = dayjs(current);
          return d.isBefore(today) || d.isAfter(maxDate);
        },
      };
    }
    return res;
  }, [formValues.applicationDepartment, departmentOptions]);

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
      {visibleFields.map((field) =>
        renderFormField({
          field,
          isReadOnly,
          departmentOptions,
          deptLoading,
          customRequest,
          linkageProps: linkagePropsByKey[field.key],
          // 联动：由 visibleWhen 控制显隐的字段（如表格附件）在显示时改为必填
          overrideRequired:
            field.key === "tableAttachments" && !!field.visibleWhen,
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

