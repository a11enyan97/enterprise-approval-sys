"use client";

/**
 * 通用表单字段渲染器
 *
 * 根据 FormField.type（19 种字段类型）动态渲染对应的 Arco Design 组件。
 * 所有字段类型与 @/lib/agent/schemas/field-types.ts 中的定义保持一一对应。
 *
 * 渲染规则：
 * 1. 优先使用 field.rules（FieldRule[] 格式），通过 toArcoRules() 转换为 Arco 格式
 * 2. 如果 field.rules 为空但 field.required 为 true，自动生成 required 规则
 * 3. field.props 透传给底层 Arco Design 组件
 * 4. field.options / field.cascaderOptions 用于选择类组件的选项渲染
 */

import {
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Checkbox,
  Cascader,
  DatePicker,
  TimePicker,
  Switch,
  Rate,
  Upload,
  TreeSelect,
  Typography,
} from "@arco-design/web-react";
import type { UploadProps } from "@arco-design/web-react";
import type { FormField } from "@/types/formBuilder";
import type { CascaderOption } from "@/types/departments";
import { toArcoRules } from "@/lib/agent/schemas";

interface FormFieldRendererProps {
  field: FormField;
  isReadOnly: boolean;
  /** 部门树数据（供 treeSelect / deptPicker 使用） */
  departmentOptions?: CascaderOption[];
  /** 部门树加载状态 */
  deptLoading?: boolean;
  /** 人员树数据（供 userPicker 使用） */
  userOptions?: CascaderOption[];
  /** 人员树加载状态 */
  userLoading?: boolean;
  /** 自定义上传函数（供 upload 类字段使用） */
  customRequest?: UploadProps['customRequest'];
}

/**
 * 根据字段配置渲染对应的表单字段组件
 */
export function renderFormField({
  field,
  isReadOnly,
  departmentOptions = [],
  deptLoading = false,
  userOptions = [],
  userLoading = false,
  customRequest,
}: FormFieldRendererProps) {
  // 隐藏字段直接不渲染
  if (field.hidden) return null;

  // 将 FieldRule[] 转换为 Arco Design 规则格式
  const arcoRules =
    field.rules && field.rules.length > 0
      ? toArcoRules(field.rules)
      : field.required
        ? [{ required: true, message: `${field.label}为必填项` }]
        : [];

  // Form.Item 公共属性
  const commonFormItemProps = {
    label: field.label,
    field: field.key,
    rules: arcoRules,
    extra: field.description ? (
      <div style={{ fontSize: "12px", color: "#86909c", marginTop: "4px" }}>
        {field.description}
      </div>
    ) : undefined,
  };

  // 组件公共属性
  const disabled = isReadOnly || field.disabled;
  const extraProps = field.props || {};

  switch (field.type) {
    // ================================================================
    // 基础输入
    // ================================================================

    case "input":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <Input
            placeholder={field.placeholder}
            disabled={disabled}
            {...extraProps}
          />
        </Form.Item>
      );

    case "textarea":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <Input.TextArea
            placeholder={field.placeholder}
            disabled={disabled}
            {...extraProps}
          />
        </Form.Item>
      );

    case "number":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <InputNumber
            placeholder={field.placeholder}
            disabled={disabled}
            style={{ width: "100%" }}
            {...extraProps}
          />
        </Form.Item>
      );

    // ================================================================
    // 选择类
    // ================================================================

    case "select":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <Select
            placeholder={field.placeholder}
            disabled={disabled}
            allowClear
            style={{ width: "100%" }}
            options={field.options}
            {...extraProps}
          />
        </Form.Item>
      );

    case "multiSelect":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <Select
            placeholder={field.placeholder}
            disabled={disabled}
            allowClear
            mode="multiple"
            style={{ width: "100%" }}
            options={field.options}
            {...extraProps}
          />
        </Form.Item>
      );

    case "radio":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <Radio.Group disabled={disabled} {...extraProps}>
            {(field.options || []).map((opt) => (
              <Radio key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
      );

    case "checkbox":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <Checkbox.Group disabled={disabled} {...extraProps}>
            {(field.options || []).map((opt) => (
              <Checkbox key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </Form.Item>
      );

    case "cascader":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <Cascader
            placeholder={field.placeholder}
            disabled={disabled}
            allowClear
            style={{ width: "100%" }}
            options={field.cascaderOptions || []}
            {...extraProps}
          />
        </Form.Item>
      );

    // ================================================================
    // 日期时间
    // ================================================================

    case "date":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <DatePicker
            placeholder={field.placeholder}
            disabled={disabled}
            style={{ width: "100%" }}
            {...extraProps}
          />
        </Form.Item>
      );

    case "dateRange":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <DatePicker.RangePicker
            disabled={disabled}
            style={{ width: "100%" }}
            {...extraProps}
          />
        </Form.Item>
      );

    case "timePicker":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <TimePicker
            placeholder={field.placeholder}
            disabled={disabled}
            style={{ width: "100%" }}
            {...extraProps}
          />
        </Form.Item>
      );

    // ================================================================
    // 开关 / 评分
    // ================================================================

    case "switch":
      return (
        <Form.Item
          key={field.key}
          {...commonFormItemProps}
          triggerPropName="checked"
        >
          <Switch disabled={disabled} {...extraProps} />
        </Form.Item>
      );

    case "rate":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <Rate disabled={disabled} {...extraProps} />
        </Form.Item>
      );

    // ================================================================
    // 文件上传
    // ================================================================

    case "uploadImage":
      return (
        <Form.Item
          key={field.key}
          {...commonFormItemProps}
          triggerPropName="fileList"
          extra={
            field.description ? (
              <div style={{ fontSize: "12px", color: "#86909c", marginTop: "4px" }}>
                {field.description}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "#86909c", marginTop: "4px" }}>
                支持格式：JPG、PNG、GIF、WebP，最多上传{" "}
                {(extraProps.limit as number) || 3} 张
              </div>
            )
          }
        >
          <Upload
            multiple
            imagePreview
            listType="picture-card"
            customRequest={customRequest}
            disabled={disabled}
            accept={
              (extraProps.accept as string) ||
              "image/jpeg,image/jpg,image/png,image/gif,image/webp"
            }
            {...extraProps}
          />
        </Form.Item>
      );

    case "uploadTable":
      return (
        <Form.Item
          key={field.key}
          {...commonFormItemProps}
          triggerPropName="fileList"
          extra={
            field.description ? (
              <div style={{ fontSize: "12px", color: "#86909c", marginTop: "4px" }}>
                {field.description}
              </div>
            ) : (
              <div style={{ fontSize: "12px", color: "#86909c", marginTop: "4px" }}>
                请根据
                <a
                  href="/template.xlsx"
                  download="template.xlsx"
                  style={{ color: "#165dff", textDecoration: "none", margin: "0 4px" }}
                >
                  表格模板
                </a>
                上传文件
              </div>
            )
          }
        >
          <Upload
            customRequest={customRequest}
            accept={(extraProps.accept as string) || ".xlsx,.xls"}
            disabled={disabled}
            {...extraProps}
          />
        </Form.Item>
      );

    case "upload":
      return (
        <Form.Item
          key={field.key}
          {...commonFormItemProps}
          triggerPropName="fileList"
        >
          <Upload
            customRequest={customRequest}
            disabled={disabled}
            {...extraProps}
          />
        </Form.Item>
      );

    // ================================================================
    // 业务组件
    // ================================================================

    case "treeSelect":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <TreeSelect
            treeData={departmentOptions}
            placeholder={field.placeholder}
            allowClear
            style={{ width: "100%" }}
            disabled={disabled}
            loading={deptLoading}
            fieldNames={{ title: "title", key: "key", children: "children" }}
            {...extraProps}
          />
        </Form.Item>
      );

    case "userPicker":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <TreeSelect
            treeData={userOptions}
            placeholder={field.placeholder || "请选择人员"}
            allowClear
            style={{ width: "100%" }}
            disabled={disabled}
            loading={userLoading}
            fieldNames={{ title: "title", key: "key", children: "children" }}
            {...extraProps}
          />
        </Form.Item>
      );

    case "deptPicker":
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <TreeSelect
            treeData={departmentOptions}
            placeholder={field.placeholder || "请选择部门"}
            allowClear
            style={{ width: "100%" }}
            disabled={disabled}
            loading={deptLoading}
            fieldNames={{ title: "title", key: "key", children: "children" }}
            {...extraProps}
          />
        </Form.Item>
      );

    // ================================================================
    // 兜底
    // ================================================================

    default: {
      const unknownType: string = field.type;
      return (
        <Form.Item key={field.key} {...commonFormItemProps}>
          <Typography.Text type="warning">
            未知字段类型：{unknownType}
          </Typography.Text>
        </Form.Item>
      );
    }
  }
}
