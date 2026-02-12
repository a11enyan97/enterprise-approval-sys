/**
 * 条件联动逻辑定义
 *
 * 职责：
 * 定义表单字段间的联动规则，支持以下场景：
 * - 根据字段 A 的值 显示/隐藏 字段 B
 * - 根据字段 A 的值 启用/禁用 字段 B
 * - 根据字段 A 的值 设置 字段 B 的值 / 必填状态 / 可选项
 *
 * 架构说明：
 * 条件规则定义在 FormSchema.conditions 中（Schema 级别），而非 FormField 上。
 * 这样做的好处：
 * 1. 所有联动逻辑集中管理，避免分散在各字段中导致难以维护
 * 2. Agent 生成时更容易推理全局条件关系
 * 3. 支持一个条件触发多个动作（ then 可以扩展为数组）
 *
 * @example
 * // 当「请假类型」为「病假」时，显示「就诊证明」上传字段
 * {
 *   id: "show_medical_cert",
 *   name: "病假需要就诊证明",
 *   when: { field: "leaveType", operator: "eq", value: "sick" },
 *   then: { action: "show", target: "medicalCert" },
 * }
 *
 * @example
 * // 当「请假天数」大于 3 时，设置「部门经理」审批为必填
 * {
 *   id: "require_dept_manager",
 *   name: "超过3天需部门经理审批",
 *   when: { field: "days", operator: "gt", value: 3 },
 *   then: { action: "setRequired", target: "deptManagerApprover", value: true },
 * }
 *
 * @example
 * // 当「出差地点」为国外时，联动修改「交通方式」的可选项
 * {
 *   id: "overseas_transport",
 *   name: "国外出差限飞机",
 *   when: { field: "destination", operator: "eq", value: "overseas" },
 *   then: {
 *     action: "setOptions",
 *     target: "transport",
 *     value: [{ label: "飞机", value: "plane" }],
 *   },
 * }
 */

import { z } from "zod";

// ================================================================
// 1. 条件操作符
// ================================================================

export const ConditionOperatorSchema = z.enum([
  "eq", // 等于
  "neq", // 不等于
  "gt", // 大于
  "lt", // 小于
  "gte", // 大于等于
  "lte", // 小于等于
  "in", // 值在列表中
  "notIn", // 值不在列表中
  "contains", // 包含（字符串）
  "empty", // 为空
  "notEmpty", // 不为空
]);

export type ConditionOperator = z.infer<typeof ConditionOperatorSchema>;

// ================================================================
// 2. 条件动作
// ================================================================

export const ConditionActionSchema = z.enum([
  "show", // 显示目标字段
  "hide", // 隐藏目标字段
  "enable", // 启用目标字段
  "disable", // 禁用目标字段
  "setValue", // 设置目标字段的值
  "setRequired", // 设置目标字段为必填 / 非必填
  "setOptions", // 设置目标字段的选项列表（联动下拉）
]);

export type ConditionAction = z.infer<typeof ConditionActionSchema>;

// ================================================================
// 3. 条件触发 (When)
// ================================================================

export const ConditionWhenSchema = z.object({
  /** 监听的源字段 key */
  field: z.string(),
  /** 比较操作符 */
  operator: ConditionOperatorSchema,
  /** 比较值（empty / notEmpty 操作符时可省略） */
  value: z.unknown().optional(),
});

export type ConditionWhen = z.infer<typeof ConditionWhenSchema>;

// ================================================================
// 4. 条件动作 (Then)
// ================================================================

export const ConditionThenSchema = z.object({
  /** 执行的动作类型 */
  action: ConditionActionSchema,
  /** 目标字段 key */
  target: z.string(),
  /**
   * 动作参数值
   * - setValue: 要设置的值
   * - setRequired: true | false
   * - setOptions: SelectOption[]
   * - show/hide/enable/disable: 不需要
   */
  value: z.unknown().optional(),
});

export type ConditionThen = z.infer<typeof ConditionThenSchema>;

// ================================================================
// 5. 完整条件规则
// ================================================================

export const ConditionRuleSchema = z.object({
  /** 规则唯一标识（用于管理和引用） */
  id: z.string(),
  /** 规则名称（可选，便于在 UI 中展示和管理） */
  name: z.string().optional(),
  /** 触发条件：当 when 满足时 */
  when: ConditionWhenSchema,
  /** 执行动作：执行 then */
  then: ConditionThenSchema,
});

export type ConditionRule = z.infer<typeof ConditionRuleSchema>;

// ================================================================
// 6. 条件求值工具函数
// ================================================================

/**
 * 对单条条件规则的 when 子句求值
 *
 * @param when - 条件定义
 * @param formValues - 当前表单所有字段的值 { [fieldKey]: value }
 * @returns 条件是否满足
 *
 * @example
 * evaluateCondition(
 *   { field: "leaveType", operator: "eq", value: "sick" },
 *   { leaveType: "sick", days: 5 }
 * ); // → true
 */
export function evaluateCondition(
  when: ConditionWhen,
  formValues: Record<string, unknown>,
): boolean {
  const fieldValue = formValues[when.field];
  const compareValue = when.value;

  switch (when.operator) {
    case "eq":
      return fieldValue === compareValue;

    case "neq":
      return fieldValue !== compareValue;

    case "gt":
      return Number(fieldValue) > Number(compareValue);

    case "lt":
      return Number(fieldValue) < Number(compareValue);

    case "gte":
      return Number(fieldValue) >= Number(compareValue);

    case "lte":
      return Number(fieldValue) <= Number(compareValue);

    case "in":
      return Array.isArray(compareValue) && compareValue.includes(fieldValue);

    case "notIn":
      return Array.isArray(compareValue) && !compareValue.includes(fieldValue);

    case "contains":
      return (
        typeof fieldValue === "string" &&
        typeof compareValue === "string" &&
        fieldValue.includes(compareValue)
      );

    case "empty":
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === "" ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      );

    case "notEmpty":
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== "" &&
        !(Array.isArray(fieldValue) && fieldValue.length === 0)
      );

    default:
      return false;
  }
}
