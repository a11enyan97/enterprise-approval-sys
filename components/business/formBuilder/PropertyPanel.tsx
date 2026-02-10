"use client";

/**
 * 属性面板：显示字段属性配置表单
 * 按需订阅 store（仅 selectedField + updateField），改表单标题、Schema 等不会触发重渲染
 */

import { useEffect, useRef } from "react";
import { Card, Form, Input, InputNumber, Switch } from "@arco-design/web-react";
import { useFormBuilderStore } from "@/store/useFormBuilderStore";

export default function PropertyPanel() {
  const [form] = Form.useForm();
  // 是否正在从全局store同步数据
  const syncingRef = useRef(false);

  const selectedField = useFormBuilderStore((state) => {
    const id = state.selectedFieldId;
    if (!id) return undefined;
    return state.schema.fields.find((f) => f._id === id);
  });
  const updateField = useFormBuilderStore((state) => state.updateField);

  useEffect(() => {
    if (selectedField) {
      syncingRef.current = true;
      form.setFieldsValue({
        label: selectedField.label,
        key: selectedField.key,
        required: selectedField.required,
        placeholder: selectedField.placeholder,
        maxLength: selectedField.props?.maxLength,
        limit: selectedField.props?.limit,
        accept: selectedField.props?.accept,
        format: selectedField.props?.format,
      });
      syncingRef.current = false;
    } else {
      syncingRef.current = true;
      form.resetFields();
      syncingRef.current = false;
    }
  }, [selectedField, form]);

  const handleChange = (_: any, values: any) => {
    if (syncingRef.current) return;
    if (!selectedField) return;
    const patch: Record<string, any> = {
      label: values.label,
      key: values.key,
      required: values.required,
      placeholder: values.placeholder,
      props: {},
    };

    if (selectedField.type === "input" || selectedField.type === "textarea") {
      patch.props.maxLength = values.maxLength ?? undefined;
    }

    if (selectedField.type === "uploadImage") {
      patch.props.limit = values.limit ?? 3;
      patch.props.accept = values.accept || "image/jpeg,image/jpg,image/png,image/gif,image/webp";
    }

    if (selectedField.type === "uploadTable") {
      patch.props.accept = values.accept || ".xlsx,.xls";
    }

    if (selectedField.type === "date") {
      patch.props.format = values.format || "YYYY-MM-DD";
    }

    if (Object.keys(patch.props).length === 0) {
      delete patch.props;
    }

    updateField(selectedField._id as string, patch);
  };

  if (!selectedField) {
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

        {(selectedField.type === "input" || selectedField.type === "textarea") && (
          <Form.Item label="最大长度" field="maxLength">
            <InputNumber min={1} max={500} placeholder="不填则不限制" style={{ width: "100%" }} />
          </Form.Item>
        )}

        {selectedField.type === "uploadImage" && (
          <>
            <Form.Item label="上传数量限制" field="limit">
              <InputNumber min={1} max={9} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="文件类型" field="accept">
              <Input placeholder="默认为常见图片格式" />
            </Form.Item>
          </>
        )}

        {selectedField.type === "uploadTable" && (
          <Form.Item label="文件类型" field="accept">
            <Input placeholder="默认为 .xlsx,.xls" />
          </Form.Item>
        )}

        {selectedField.type === "date" && (
          <Form.Item label="格式" field="format">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
        )}
      </Form>
    </Card>
  );
}
