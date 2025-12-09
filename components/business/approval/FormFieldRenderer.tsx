"use client";

import { Form, Input, DatePicker, TreeSelect, Upload } from "@arco-design/web-react";
import type { FormFieldConfig } from "@/types/form";
import type { CascaderOption } from "@/types/departments";

interface FormFieldRendererProps {
  field: FormFieldConfig;
  isReadOnly: boolean;
  departmentOptions?: CascaderOption[];
  deptLoading?: boolean;
  customRequest?: (option: any) => Promise<void>;
}

/**
 * 根据字段配置渲染对应的表单字段组件
 */
export function renderFormField({
  field,
  isReadOnly,
  departmentOptions = [],
  deptLoading = false,
  customRequest,
}: FormFieldRendererProps) {
  const commonProps = {
    label: field.label,
    field: field.key,
    rules: field.rules || (field.required ? [{ required: true, message: `${field.label}为必填项` }] : []),
  };

  switch (field.type) {
    case "input":
      return (
        <Form.Item key={field.key} {...commonProps}>
          <Input
            placeholder={field.placeholder}
            disabled={isReadOnly}
            {...(field.componentProps || {})}
          />
        </Form.Item>
      );
    case "textarea":
      return (
        <Form.Item key={field.key} {...commonProps}>
          <Input.TextArea
            placeholder={field.placeholder}
            disabled={isReadOnly}
            {...(field.componentProps || {})}
          />
        </Form.Item>
      );
    case "date":
      return (
        <Form.Item key={field.key} {...commonProps}>
          <DatePicker
            placeholder={field.placeholder}
            disabled={isReadOnly}
            style={{ width: '100%' }}
            {...(field.componentProps || {})}
          />
        </Form.Item>
      );
    case "treeSelect":
      return (
        <Form.Item key={field.key} {...commonProps}>
          <TreeSelect
            treeData={departmentOptions}
            placeholder={field.placeholder}
            allowClear
            style={{ width: "100%" }}
            disabled={isReadOnly}
            loading={deptLoading}
            fieldNames={{
              title: "title",
              key: "key",
              children: "children",
            }}
            {...(field.componentProps || {})}
          />
        </Form.Item>
      );
    case "uploadImage":
      return (
        <Form.Item
          key={field.key}
          label={field.label}
          field={field.key}
          triggerPropName="fileList"
          extra={
            <div style={{ fontSize: '12px', color: '#86909c', marginTop: '4px' }}>
              支持格式：JPG、PNG、GIF、WebP，最多上传 3 张
            </div>
          }
        >
          <Upload
            multiple
            imagePreview
            listType="picture-card"
            customRequest={customRequest}
            disabled={isReadOnly}
            accept={field.componentProps?.accept || "image/jpeg,image/jpg,image/png,image/gif,image/webp"}
            {...(field.componentProps || {})}
          />
        </Form.Item>
      );
    case "uploadTable":
      return (
        <Form.Item
          key={field.key}
          label={field.label}
          field={field.key}
          triggerPropName="fileList"
          extra={
            <div style={{ fontSize: '12px', color: '#86909c', marginTop: '4px' }}>
              请根据
              <a
                href="/template.xlsx"
                download="template.xlsx"
                style={{ color: '#165dff', textDecoration: 'none', margin: '0 4px' }}
              >
                表格模板
              </a>
              上传文件
            </div>
          }
        >
          <Upload
            customRequest={customRequest}
            accept='.xlsx,.xls'
            disabled={isReadOnly}
            {...(field.componentProps || {})}
          />
        </Form.Item>
      );
    default:
      return null;
  }
}

