"use server";

import {
  getAllDepartments,
  getDepartmentCascaderOptions,
} from "@/services/departments.service";
import { handleActionError } from "@/services/_shared/errors";

/**
 * 获取部门列表
 * @param format 'cascader' | 'list' (默认: 'cascader')
 */
export async function getDepartmentsAction(format: "cascader" | "list" = "cascader") {
  try {
    if (format === "cascader") {
      // 返回三级级联格式
      const options = await getDepartmentCascaderOptions();
      return {
        success: true,
        data: options,
      };
    } else {
      // 返回原始部门列表
      const departments = await getAllDepartments();
      return {
        success: true,
        data: departments,
      };
    }
  } catch (error) {
    const errorResponse = handleActionError(error, "获取部门列表失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

