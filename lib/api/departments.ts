/**
 * 部门相关 API
 */

import { apiGet } from "./client";

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
  const response = await apiGet<CascaderOption[]>("/api/departments", {
    format: "cascader",
  });

  if (!response.success || !response.data) {
    throw new Error(response.error || "获取部门列表失败");
  }

  return response.data;
}

