/**
 * 表单 Schema 类型系统 — 统一导出
 *
 * 此模块是整个表单类型体系的入口，外部应统一从这里导入：
 *
 * @example
 * // 导入类型
 * import type { FormSchema, FormField, FormFieldType, FieldRule, ConditionRule } from "@/lib/agent/schemas";
 *
 * // 导入 Zod Schema（用于运行时校验 / Agent Structured Output）
 * import { FormSchemaSchema, FormFieldSchema, FieldRuleSchema } from "@/lib/agent/schemas";
 *
 * // 导入工具函数
 * import { toArcoRules, fromArcoRules, evaluateCondition } from "@/lib/agent/schemas";
 *
 * // 导入字段类型元信息（用于设计器 Palette / Agent 上下文）
 * import { FIELD_TYPE_META, FIELD_TYPE_GROUPS } from "@/lib/agent/schemas";
 */

// ── 字段类型 ──
export {
  FormFieldTypeSchema,
  SelectOptionSchema,
  CascaderOptionSchema,
  FIELD_TYPE_META,
  FIELD_TYPE_GROUPS,
  type FormFieldType,
  type SelectOption,
  type CascaderOption,
  type FieldTypeMeta,
} from "./field-types";

// ── 校验规则 ──
export {
  RuleTypeSchema,
  FieldRuleSchema,
  toArcoRules,
  fromArcoRules,
  type RuleType,
  type FieldRule,
} from "./validation-rules";

// ── 条件联动 ──
export {
  ConditionOperatorSchema,
  ConditionActionSchema,
  ConditionWhenSchema,
  ConditionThenSchema,
  ConditionRuleSchema,
  evaluateCondition,
  type ConditionOperator,
  type ConditionAction,
  type ConditionWhen,
  type ConditionThen,
  type ConditionRule,
} from "./condition-logic";

// ── 核心 Schema ──
export {
  FormFieldSchema,
  FormLayoutSchema,
  FormSchemaSchema,
  type FormField,
  type FormLayout,
  type FormLayoutConfig,
  type FormSchema,
} from "./form-schema";
