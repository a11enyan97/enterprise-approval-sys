/**
 * 表单类型定义 — 统一从 Zod Schema 推导
 *
 * 改造说明：
 * - 旧版：手写 interface，无运行时校验
 * - 新版：Zod Schema 定义 → z.infer 推导类型 → 从此文件统一 re-export
 *
 * 外部代码依然从 "@/types/formBuilder" 导入，无需修改导入路径。
 * 如需 Zod Schema 本体（用于运行时校验 / Agent Structured Output），
 * 请直接从 "@/lib/agent/schemas" 导入。
 */

// ── 字段类型 ──
export type { FormFieldType, SelectOption, CascaderOption } from "@/lib/agent/schemas";

// ── 校验规则 ──
export type { FieldRule } from "@/lib/agent/schemas";

// ── 条件联动 ──
export type { ConditionRule } from "@/lib/agent/schemas";

// ── 核心类型 ──
export type { FormField, FormLayout, FormSchema } from "@/lib/agent/schemas";

/**
 * 布局配置（兼容旧代码的类型别名）
 * @deprecated 请使用 FormLayout
 */
export type { FormLayoutConfig } from "@/lib/agent/schemas";
