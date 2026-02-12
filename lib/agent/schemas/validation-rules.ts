/**
 * 校验规则定义
 *
 * 职责：
 * 1. FieldRule — 结构化校验规则（替代原来的 any[] / Arco Design 原始格式）
 * 2. toArcoRules() — 将 FieldRule[] 转换为 Arco Design Form 组件识别的规则格式
 * 3. fromArcoRules() — 将 Arco 旧格式转换为 FieldRule[]（用于数据库迁移 / 兼容）
 *
 * 设计原则：
 * - Schema 存储层使用结构化的 FieldRule 格式（LLM 可生成、易校验、可序列化）
 * - 渲染层通过 toArcoRules() 转换为 Arco Design 格式
 */

import { z } from "zod";

// ================================================================
// 1. 校验规则类型枚举
// ================================================================

export const RuleTypeSchema = z.enum([
  "required", // 必填
  "minLength", // 最小长度（文本类）
  "maxLength", // 最大长度（文本类）
  "min", // 最小值（数字类）
  "max", // 最大值（数字类）
  "pattern", // 正则表达式
  "email", // 邮箱格式
  "url", // URL 格式
  "phone", // 手机号格式
]);

export type RuleType = z.infer<typeof RuleTypeSchema>;

// ================================================================
// 2. 单条校验规则 Schema
// ================================================================

export const FieldRuleSchema = z.object({
  /** 规则类型 */
  type: RuleTypeSchema,
  /** 规则参数值（minLength/maxLength/min/max 用 number，pattern 用 string） */
  value: z.union([z.string(), z.number()]).optional(),
  /** 校验失败时的提示信息 */
  message: z.string().optional(),
});

export type FieldRule = z.infer<typeof FieldRuleSchema>;

// ================================================================
// 3. FieldRule[] → Arco Design Rules 转换器
// ================================================================

/**
 * 将结构化的 FieldRule[] 转换为 Arco Design Form 组件识别的校验规则格式
 *
 * @example
 * const arcoRules = toArcoRules([
 *   { type: "required", message: "请输入项目名称" },
 *   { type: "maxLength", value: 100, message: "不超过100字" },
 * ]);
 * // → [{ required: true, message: "请输入项目名称" }, { maxLength: 100, message: "不超过100字" }]
 */
export function toArcoRules(rules: FieldRule[]): Record<string, unknown>[] {
  return rules.map((rule) => {
    const base: Record<string, unknown> = {};
    if (rule.message) base.message = rule.message;

    switch (rule.type) {
      case "required":
        return { ...base, required: true };

      case "minLength":
        return { ...base, minLength: rule.value };

      case "maxLength":
        return { ...base, maxLength: rule.value };

      case "min":
        return { ...base, type: "number", min: rule.value };

      case "max":
        return { ...base, type: "number", max: rule.value };

      case "pattern":
        return { ...base, match: new RegExp(rule.value as string) };

      case "email":
        return {
          ...base,
          match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: rule.message || "请输入有效的邮箱地址",
        };

      case "url":
        return {
          ...base,
          match: /^https?:\/\/.+/,
          message: rule.message || "请输入有效的 URL",
        };

      case "phone":
        return {
          ...base,
          match: /^1[3-9]\d{9}$/,
          message: rule.message || "请输入有效的手机号",
        };

      default:
        return base;
    }
  });
}

// ================================================================
// 4. Arco Design Rules → FieldRule[] 转换器（旧数据兼容）
// ================================================================

/**
 * 将 Arco Design 旧格式的校验规则转换为结构化的 FieldRule[]
 *
 * 用途：
 * - 数据库中已有的旧格式 Schema 迁移
 * - 从 Arco Form 原生规则反向解析
 *
 * @example
 * const fieldRules = fromArcoRules([
 *   { required: true, message: "必填" },
 *   { maxLength: 300, message: "太长了" },
 * ]);
 * // → [{ type: "required", message: "必填" }, { type: "maxLength", value: 300, message: "太长了" }]
 */
export function fromArcoRules(
  arcoRules: Record<string, unknown>[],
): FieldRule[] {
  return arcoRules
    .map((rule): FieldRule | null => {
      const message = typeof rule.message === "string" ? rule.message : undefined;

      if (rule.required === true) {
        return { type: "required", message };
      }
      if (typeof rule.minLength === "number") {
        return { type: "minLength", value: rule.minLength, message };
      }
      if (typeof rule.maxLength === "number") {
        return { type: "maxLength", value: rule.maxLength, message };
      }
      if (typeof rule.min === "number") {
        return { type: "min", value: rule.min, message };
      }
      if (typeof rule.max === "number") {
        return { type: "max", value: rule.max, message };
      }
      if (rule.type === "email") {
        return { type: "email", message };
      }
      if (rule.type === "url") {
        return { type: "url", message };
      }
      // match / pattern → 尝试转为 pattern 规则
      if (rule.match instanceof RegExp) {
        return { type: "pattern", value: rule.match.source, message };
      }
      if (typeof rule.pattern === "string") {
        return { type: "pattern", value: rule.pattern, message };
      }

      return null;
    })
    .filter((r): r is FieldRule => r !== null);
}
