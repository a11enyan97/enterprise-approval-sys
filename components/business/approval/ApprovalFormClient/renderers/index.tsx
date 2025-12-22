import React from "react";
import { Form, Input, DatePicker, TreeSelect, Upload } from "@arco-design/web-react";
import type { FormField } from "@/types/formBuilder";
import type { CascaderOption } from "@/types/departments";

export interface RendererProps {
  field: FormField;
  isReadOnly: boolean;
  commonProps: any;
  // Specific props
  departmentOptions?: CascaderOption[];
  deptLoading?: boolean;
  customRequest?: (option: any) => Promise<void>;
}

// Input Renderer
export const InputRenderer: React.FC<RendererProps> = ({ field, isReadOnly, commonProps }) => (
  <Form.Item key={field.key} {...commonProps}>
    <Input
      placeholder={field.placeholder}
      disabled={isReadOnly}
      {...(field.props || {})}
    />
  </Form.Item>
);

// TextArea Renderer
export const TextAreaRenderer: React.FC<RendererProps> = ({ field, isReadOnly, commonProps }) => (
  <Form.Item key={field.key} {...commonProps}>
    <Input.TextArea
      placeholder={field.placeholder}
      disabled={isReadOnly}
      {...(field.props || {})}
    />
  </Form.Item>
);

// Date Renderer
export const DateRenderer: React.FC<RendererProps> = ({ field, isReadOnly, commonProps }) => (
  <Form.Item key={field.key} {...commonProps}>
    <DatePicker
      placeholder={field.placeholder}
      disabled={isReadOnly}
      style={{ width: '100%' }}
      {...(field.props || {})}
    />
  </Form.Item>
);

// TreeSelect Renderer
export const TreeSelectRenderer: React.FC<RendererProps> = ({ 
  field, 
  isReadOnly, 
  commonProps, 
  departmentOptions = [], 
  deptLoading 
}) => (
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
      {...(field.props || {})}
    />
  </Form.Item>
);

// Image Upload Renderer
export const ImageUploadRenderer: React.FC<RendererProps> = ({ 
  field, 
  isReadOnly, 
  commonProps, 
  customRequest 
}) => (
  <Form.Item
    key={field.key}
    label={field.label}
    field={field.key}
    triggerPropName="fileList"
    rules={field.rules || (field.required ? [{ required: true, message: `${field.label}为必填项` }] : [])}
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
      accept={field.props?.accept || "image/jpeg,image/jpg,image/png,image/gif,image/webp"}
      {...(field.props || {})}
    />
  </Form.Item>
);

// Excel Upload Renderer
export const ExcelUploadRenderer: React.FC<RendererProps> = ({ 
  field, 
  isReadOnly, 
  commonProps, 
  customRequest 
}) => (
  <Form.Item
    key={field.key}
    label={field.label}
    field={field.key}
    triggerPropName="fileList"
    rules={field.rules || (field.required ? [{ required: true, message: `${field.label}为必填项` }] : [])}
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
      {...(field.props || {})}
    />
  </Form.Item>
);

