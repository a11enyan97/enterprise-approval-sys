"use client";

import React from "react";
import type { FormField } from "@/types/formBuilder";
import type { CascaderOption } from "@/types/departments";
import {
  InputRenderer,
  TextAreaRenderer,
  DateRenderer,
  TreeSelectRenderer,
  ImageUploadRenderer,
  ExcelUploadRenderer,
  type RendererProps
} from "./renderers";

interface FormFieldRendererProps {
  field: FormField;
  isReadOnly: boolean;
  departmentOptions?: CascaderOption[];
  deptLoading?: boolean;
  customRequest?: (option: any) => Promise<void>;
  /** 联动产生的额外 props（如 disabledDate），由表单组件根据 useWatch 计算传入 */
  linkageProps?: Record<string, unknown>;
  /** 联动时覆盖必填（如「预算」时表格附件必填） */
  overrideRequired?: boolean;
}

// --- 核心工厂模式实现 ---

// 1. 定义组件映射表 (Strategy Map)
// Key: Schema 中的 type 类型
// Value: 对应的渲染组件
const FIELD_RENDERER_MAP: Record<string, React.FC<RendererProps>> = {
  input: InputRenderer,
  textarea: TextAreaRenderer,
  date: DateRenderer,
  treeSelect: TreeSelectRenderer,
  uploadImage: ImageUploadRenderer,
  uploadTable: ExcelUploadRenderer,
};

/**
 * 根据字段配置渲染对应的表单字段组件
 */
export function renderFormField(props: FormFieldRendererProps) {
  const { field, overrideRequired } = props;

  const required = overrideRequired ?? field.required;
  const rules =
    field.rules ||
    (required ? [{ required: true, message: `${field.label}为必填项` }] : []);

  // 1. 提取通用属性
  const commonProps = {
    label: field.label,
    field: field.key,
    rules,
  };

  // 2. 从映射表获取渲染组件（工厂分发）
  const SpecificRenderer = FIELD_RENDERER_MAP[field.type];

  if (!SpecificRenderer) {
    console.warn(`[FormFieldRenderer] No renderer found for field type: ${field.type}`);
    return null;
  }

  // 3. 执行渲染（传入 linkageProps 供日期等组件做联动禁用）
  return (
    <SpecificRenderer
      key={field.key}
      {...props}
      commonProps={commonProps}
    />
  );
}
