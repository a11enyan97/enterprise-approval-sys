/**
 * 核心表单 Schema 定义
 *
 * 这是整个表单系统的 **单一数据源 (Single Source of Truth)**：
 * - Zod Schema 定义数据结构 → z.infer 推导 TypeScript 类型
 * - 表单设计器（手动拖拽）和 AI Agent（自然语言生成）共用同一套类型
 * - 数据库 FormTemplate.schema 字段存储的就是 FormSchema 序列化后的 JSON
 *
 * 类型继承关系：
 * FormSchemaSchema (Zod)
 *   ├── FormFieldSchema (Zod) → FormField (TS)
 *   │     ├── FormFieldTypeSchema → FormFieldType (TS)
 *   │     ├── FieldRuleSchema → FieldRule (TS)
 *   │     └── SelectOptionSchema → SelectOption (TS)
 *   ├── FormLayoutSchema (Zod) → FormLayout (TS)
 *   └── ConditionRuleSchema → ConditionRule (TS)
 *   → FormSchema (TS)
 */

import { z } from "zod";
import {
  FormFieldTypeSchema,
  SelectOptionSchema,
  CascaderOptionSchema,
} from "./field-types";
import { FieldRuleSchema } from "./validation-rules";
import { ConditionRuleSchema } from "./condition-logic";

// ================================================================
// 1. 表单字段 Schema
// ================================================================

export const FormFieldSchema = z.object({
  // ── 标识属性 ──

  /** 前端拖拽排序用的唯一 ID（仅前端运行时使用，不入库） */
  _id: z.string().optional(),
  /** 字段唯一标识（提交数据的 key，同一表单内不可重复） */
  key: z.string().min(1),
  /** 字段类型 */
  type: FormFieldTypeSchema,
  /** 显示标签 */
  label: z.string().min(1),

  // ── 状态属性 ──

  /** 是否必填 */
  required: z.boolean().default(false),
  /** 是否隐藏（可被条件逻辑动态控制） */
  hidden: z.boolean().optional(),
  /** 是否禁用（可被条件逻辑动态控制） */
  disabled: z.boolean().optional(),

  // ── 展示属性 ──

  /** 占位提示文本 */
  placeholder: z.string().optional(),
  /** 字段描述 / 帮助文本（显示在字段下方） */
  description: z.string().optional(),
  /** 默认值 */
  defaultValue: z.unknown().optional(),

  // ── 校验规则 ──

  /** 结构化校验规则列表（渲染时通过 toArcoRules 转换为 Arco 格式） */
  rules: z.array(FieldRuleSchema).optional(),

  // ── 选项数据（select / multiSelect / radio / checkbox 使用）──

  /** 静态选项列表 */
  options: z.array(SelectOptionSchema).optional(),
  /** 级联选项（cascader 使用） */
  cascaderOptions: z.array(CascaderOptionSchema).optional(),

  // ── 组件透传属性 ──

  /**
   * 组件特有属性，直接透传给底层 UI 组件
   *
   * 不同字段类型的典型 props：
   * - input/textarea: { maxLength, showWordLimit, autoSize }
   * - number: { min, max, precision, step }
   * - date: { format }
   * - uploadImage: { limit, accept, listType }
   * - select: { allowClear, showSearch }
   * - treeSelect: { treeData }
   */
  props: z.record(z.unknown()).optional(),
});

// ================================================================
// 2. 表单布局 Schema
// ================================================================

export const FormLayoutSchema = z.object({
  /** label 列宽（Arco Grid 栅格数） */
  labelCol: z.object({ span: z.number() }).optional(),
  /** wrapper 列宽（Arco Grid 栅格数） */
  wrapperCol: z.object({ span: z.number() }).optional(),
  /** 多列布局（1~4 列），默认 1 列 */
  columns: z.number().min(1).max(4).optional(),
  /** label 对齐方式 */
  labelAlign: z.enum(["left", "right"]).optional(),
});

// ================================================================
// 3. 完整表单 Schema
// ================================================================

export const FormSchemaSchema = z.object({
  /**
   * Schema 版本号
   * - 旧数据（v1.0 之前）没有此字段
   * - 新创建的表单统一为 "1.0"
   */
  version: z.string().optional(),

  /** 表单唯一标识（如 "approval.create"、"leave.apply"） */
  key: z.string().min(1),
  /** 表单标题 */
  title: z.string().min(1),
  /** 表单描述 */
  description: z.string().optional(),

  /** 布局配置 */
  layout: FormLayoutSchema.optional(),

  /** 字段列表（有序） */
  fields: z.array(FormFieldSchema),

  /**
   * 条件联动规则列表
   *
   * 定义在 Schema 级别，集中管理所有字段间的联动逻辑。
   * 渲染引擎根据 conditions 和当前表单值，动态控制字段的显隐、启禁、选项等。
   *
   * @see condition-logic.ts 中的 evaluateCondition() 用于运行时求值
   */
  conditions: z.array(ConditionRuleSchema).optional(),
});

// ================================================================
// 4. 导出推导的 TypeScript 类型
// ================================================================

/** 表单字段 */
export type FormField = z.infer<typeof FormFieldSchema>;

/** 表单布局配置 */
export type FormLayout = z.infer<typeof FormLayoutSchema>;

/** 完整表单 Schema（核心数据结构） */
export type FormSchema = z.infer<typeof FormSchemaSchema>;

/**
 * 兼容旧代码的布局类型别名
 * @deprecated 请使用 FormLayout
 */
export type FormLayoutConfig = FormLayout;
