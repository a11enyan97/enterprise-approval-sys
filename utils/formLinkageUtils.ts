/**
 * 复杂表单联动工具
 * 用于根据表单当前值计算字段显隐、日期禁用等
 */
import type { FormField, VisibleWhenCondition } from "@/types/formBuilder";

/**
 * 判断联动显隐条件是否满足
 */
export function isFieldVisible(
  field: FormField,
  formValues: Record<string, unknown>
): boolean {
  const cond = field.visibleWhen;
  if (!cond) return true;

  const raw = formValues[cond.field];
  const value = typeof raw === "string" ? raw : raw != null ? String(raw) : "";

  switch (cond.op) {
    case "includes":
      return cond.value != null && value.includes(cond.value);
    case "eq":
      return cond.value != null && value === cond.value;
    case "notEmpty":
      return value.trim() !== "";
    default:
      return true;
  }
}

/**
 * 判断选中的部门是否为一层部门（用于执行日期联动：一层部门仅允许选未来 7 天）
 */
export function isFirstLevelDepartment(
  selectedDeptKey: string | undefined,
  departmentOptions: { key?: string }[]
): boolean {
  if (!selectedDeptKey) return false;
  const firstLevelKeys = departmentOptions.map((o) => o.key).filter(Boolean);
  return firstLevelKeys.includes(selectedDeptKey);
}
