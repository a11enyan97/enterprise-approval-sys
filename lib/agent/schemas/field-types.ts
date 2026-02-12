/**
 * 字段类型定义
 *
 * 职责：
 * 1. FormFieldType 枚举 — 系统支持的所有字段类型
 * 2. SelectOption / CascaderOption — 选择类字段的选项结构
 * 3. FIELD_TYPE_META — 字段类型元信息注册表（label / group / defaultProps）
 * 4. FIELD_TYPE_GROUPS — 分组定义，供表单设计器 Palette 和 Agent 使用
 */

import { z } from "zod";

// ================================================================
// 1. 字段类型枚举
// ================================================================

export const FormFieldTypeSchema = z.enum([
  // ── 基础输入 ──
  "input", // 单行文本
  "textarea", // 多行文本
  "number", // 数字输入

  // ── 选择类 ──
  "select", // 下拉单选
  "multiSelect", // 下拉多选
  "radio", // 单选按钮组
  "checkbox", // 复选框组
  "cascader", // 级联选择

  // ── 日期时间 ──
  "date", // 日期选择
  "dateRange", // 日期范围
  "timePicker", // 时间选择

  // ── 开关 / 评分 ──
  "switch", // 开关
  "rate", // 评分

  // ── 文件上传 ──
  "uploadImage", // 图片上传
  "uploadTable", // 表格上传
  "upload", // 通用文件上传

  // ── 业务组件 ──
  "treeSelect", // 树形选择（通用）
  "userPicker", // 人员选择器
  "deptPicker", // 部门选择器
]);

export type FormFieldType = z.infer<typeof FormFieldTypeSchema>;

// ================================================================
// 2. 选项 Schema
// ================================================================

/** 下拉/单选/多选/复选 的选项 */
export const SelectOptionSchema = z.object({
  /** 显示文本 */
  label: z.string(),
  /** 选项值 */
  value: z.union([z.string(), z.number()]),
  /** 是否禁用该选项 */
  disabled: z.boolean().optional(),
});

export type SelectOption = z.infer<typeof SelectOptionSchema>;

/** 级联选择的选项（支持嵌套 children） */
export interface CascaderOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  children?: CascaderOption[];
}

// 级联选项的 Zod Schema（用 z.lazy 实现递归）
export const CascaderOptionSchema: z.ZodType<CascaderOption> = z.lazy(() =>
  z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    disabled: z.boolean().optional(),
    children: z.array(CascaderOptionSchema).optional(),
  }),
);

// ================================================================
// 3. 字段类型元信息注册表
// ================================================================

export interface FieldTypeMeta {
  /** 中文名称 */
  label: string;
  /** 简短描述（用于设计器 Palette / Agent 上下文） */
  description: string;
  /** 所属分组 key */
  group: string;
  /** 是否需要配置选项列表 (select / radio / checkbox 等) */
  hasOptions?: boolean;
  /** 默认的组件 props */
  defaultProps?: Record<string, unknown>;
}

/**
 * 每种字段类型的元信息
 *
 * 用途：
 * - 表单设计器 Palette 展示
 * - Agent 上下文注入（让 LLM 知道有哪些字段类型可用）
 * - 创建字段时填充 defaultProps
 */
export const FIELD_TYPE_META: Record<FormFieldType, FieldTypeMeta> = {
  // ── 基础输入 ──
  input: {
    label: "单行文本",
    description: "文本输入框",
    group: "basic",
    defaultProps: { maxLength: 100 },
  },
  textarea: {
    label: "多行文本",
    description: "支持自动换行",
    group: "basic",
    defaultProps: {
      maxLength: 300,
      showWordLimit: true,
      autoSize: { minRows: 3, maxRows: 6 },
    },
  },
  number: {
    label: "数字输入",
    description: "仅允许数字",
    group: "basic",
    defaultProps: { precision: 0, style: { width: "100%" } },
  },

  // ── 选择类 ──
  select: {
    label: "下拉单选",
    description: "下拉选择一项",
    group: "select",
    hasOptions: true,
    defaultProps: { allowClear: true, style: { width: "100%" } },
  },
  multiSelect: {
    label: "下拉多选",
    description: "下拉选择多项",
    group: "select",
    hasOptions: true,
    defaultProps: { allowClear: true, mode: "multiple", style: { width: "100%" } },
  },
  radio: {
    label: "单选按钮组",
    description: "单选按钮",
    group: "select",
    hasOptions: true,
  },
  checkbox: {
    label: "复选框组",
    description: "多选复选框",
    group: "select",
    hasOptions: true,
  },
  cascader: {
    label: "级联选择",
    description: "多级联动选择",
    group: "select",
    defaultProps: { allowClear: true, style: { width: "100%" } },
  },

  // ── 日期时间 ──
  date: {
    label: "日期选择",
    description: "YYYY-MM-DD",
    group: "datetime",
    defaultProps: { format: "YYYY-MM-DD", style: { width: "100%" } },
  },
  dateRange: {
    label: "日期范围",
    description: "起止日期选择",
    group: "datetime",
    defaultProps: { format: "YYYY-MM-DD", style: { width: "100%" } },
  },
  timePicker: {
    label: "时间选择",
    description: "HH:mm",
    group: "datetime",
    defaultProps: { format: "HH:mm", style: { width: "100%" } },
  },

  // ── 开关 / 评分 ──
  switch: {
    label: "开关",
    description: "是/否切换",
    group: "other",
  },
  rate: {
    label: "评分",
    description: "星级评分",
    group: "other",
    defaultProps: { count: 5 },
  },

  // ── 文件上传 ──
  uploadImage: {
    label: "图片上传",
    description: "支持多图预览",
    group: "upload",
    defaultProps: {
      multiple: true,
      imagePreview: true,
      listType: "picture-card",
      limit: 3,
      accept: "image/jpeg,image/jpg,image/png,image/gif,image/webp",
    },
  },
  uploadTable: {
    label: "表格上传",
    description: "上传 Excel",
    group: "upload",
    defaultProps: { accept: ".xlsx,.xls" },
  },
  upload: {
    label: "文件上传",
    description: "通用文件上传",
    group: "upload",
    defaultProps: { limit: 5 },
  },

  // ── 业务组件 ──
  treeSelect: {
    label: "树形选择",
    description: "树形下拉选择",
    group: "business",
    defaultProps: { allowClear: true, style: { width: "100%" } },
  },
  userPicker: {
    label: "人员选择",
    description: "选择组织人员",
    group: "business",
    defaultProps: { style: { width: "100%" } },
  },
  deptPicker: {
    label: "部门选择",
    description: "选择组织部门",
    group: "business",
    defaultProps: { allowClear: true, style: { width: "100%" } },
  },
};

// ================================================================
// 4. 字段类型分组（供设计器 Palette 和 Agent 使用）
// ================================================================

export const FIELD_TYPE_GROUPS = {
  basic: {
    label: "基础输入",
    types: ["input", "textarea", "number"] as FormFieldType[],
  },
  select: {
    label: "选择类",
    types: ["select", "multiSelect", "radio", "checkbox", "cascader"] as FormFieldType[],
  },
  datetime: {
    label: "日期时间",
    types: ["date", "dateRange", "timePicker"] as FormFieldType[],
  },
  other: {
    label: "其他",
    types: ["switch", "rate"] as FormFieldType[],
  },
  upload: {
    label: "文件上传",
    types: ["uploadImage", "uploadTable", "upload"] as FormFieldType[],
  },
  business: {
    label: "业务组件",
    types: ["treeSelect", "userPicker", "deptPicker"] as FormFieldType[],
  },
};
