"use client";

import { useEffect, useRef } from "react";
import { Card, Form, Input, InputNumber, Switch } from "@arco-design/web-react";
import type { FormField } from "@/types/formBuilder";

interface PropertyPanelProps {
  field: FormField | undefined;
  onChange: (patch: {
    label?: string;
    key?: string;
    required?: boolean;
    placeholder?: string;
    props?: Record<string, any>;
  }) => void;
}

export default function PropertyPanel({ field, onChange }: PropertyPanelProps) {
  const [form] = Form.useForm();
  const syncingRef = useRef(false);

  useEffect(() => {
    if (field) {
      syncingRef.current = true;
      form.setFieldsValue({
        label: field.label,
        key: field.key,
        required: field.required,
        placeholder: field.placeholder,
        maxLength: field.props?.maxLength,
        limit: field.props?.limit,
        accept: field.props?.accept,
        format: field.props?.format,
      });
      syncingRef.current = false;
    } else {
      syncingRef.current = true;
      form.resetFields();
      syncingRef.current = false;
    }
  }, [field, form]);

  const handleChange = (_: any, values: any) => {
    if (syncingRef.current) return;
    if (!field) return;
    const patch: any = {
      label: values.label,
      key: values.key,
      required: values.required,
      placeholder: values.placeholder,
      props: {},
    };

    if (field.type === "input" || field.type === "textarea") {
      patch.props.maxLength = values.maxLength ?? undefined;
    }

    if (field.type === "uploadImage") {
      patch.props.limit = values.limit ?? 3;
      patch.props.accept = values.accept || "image/jpeg,image/jpg,image/png,image/gif,image/webp";
    }

    if (field.type === "uploadTable") {
      patch.props.accept = values.accept || ".xlsx,.xls";
    }

    if (field.type === "date") {
      patch.props.format = values.format || "YYYY-MM-DD";
    }

    if (Object.keys(patch.props).length === 0) {
      delete patch.props;
    }

    onChange(patch);
  };

  if (!field) {
    return (
      <Card size="small" title="属性配置">
        <div className="text-sm text-gray-500">选择画布中的字段以配置属性</div>
      </Card>
    );
  }

  return (
    <Card size="small" title="属性配置">
      <Form form={form} layout="vertical" onValuesChange={handleChange}>
        <Form.Item label="标题" field="label" rules={[{ required: true, message: "请输入标题" }]}>
          <Input allowClear placeholder="如：审批项目" />
        </Form.Item>
        <Form.Item label="字段 Key" field="key" rules={[{ required: true, message: "请输入字段 key" }]}>
          <Input allowClear placeholder="如：project_name" />
        </Form.Item>
        <Form.Item label="占位提示" field="placeholder">
          <Input allowClear placeholder="请输入占位提示" />
        </Form.Item>
        <Form.Item label="是否必填" field="required" triggerPropName="checked">
          <Switch />
        </Form.Item>

        {(field.type === "input" || field.type === "textarea") && (
          <Form.Item label="最大长度" field="maxLength">
            <InputNumber min={1} max={500} placeholder="不填则不限制" style={{ width: "100%" }} />
          </Form.Item>
        )}

        {field.type === "uploadImage" && (
          <>
            <Form.Item label="上传数量限制" field="limit">
              <InputNumber min={1} max={9} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="文件类型" field="accept">
              <Input placeholder="默认为常见图片格式" />
            </Form.Item>
          </>
        )}

        {field.type === "uploadTable" && (
          <Form.Item label="文件类型" field="accept">
            <Input placeholder="默认为 .xlsx,.xls" />
          </Form.Item>
        )}

        {field.type === "date" && (
          <Form.Item label="格式" field="format">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
        )}
      </Form>
    </Card>
  );
}

