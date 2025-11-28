/**
 * 部门相关 API（使用 Server Actions）
 */

import { getDepartmentsAction } from "@/actions/departments.action";

/**
 * 树形选择器选项类型
 */
export interface CascaderOption {
  title?: string;
  key?: string;
  children?: CascaderOption[];
}

/**
 * 获取部门级联选项
 */
export async function getDepartmentCascaderOptions(): Promise<CascaderOption[]> {
  const response = await getDepartmentsAction("cascader");

  if (!response.success || !response.data) {
    throw new Error(response.error || "获取部门列表失败");
  }

  return response.data;
}

