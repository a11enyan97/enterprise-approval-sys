"use client";

/**
 * 表单信息（标题/描述）
 */

import { useEffect } from "react";
import { Card, Form, Input } from "@arco-design/web-react";
import { useFormBuilderStore } from "@/store/useFormBuilderStore";

export default function FormMetaSection() {
  const title = useFormBuilderStore((state) => state.schema.title);
  const description = useFormBuilderStore((state) => state.schema.description);
  const updateMeta = useFormBuilderStore((state) => state.updateMeta);

  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({ title, description });
  }, [title, description, form]);

  return (
    <Card size="small" title="表单信息">
      <Form
        layout="vertical"
        form={form}
        onValuesChange={(_: unknown, values: { title?: string; description?: string }) => updateMeta(values)}
      >
        <Form.Item label="表单标题" field="title" rules={[{ required: true, message: "请输入表单标题" }]}>
          <Input placeholder="如：审批单" />
        </Form.Item>
        <Form.Item label="表单描述" field="description">
          <Input.TextArea placeholder="请输入描述" autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
      </Form>
    </Card>
  );
}
