import { NextResponse } from "next/server";
import {
  getAllDepartments,
  getDepartmentCascaderOptions,
} from "./service";
import { handleApiError } from "../_shared/errors";

/**
 * 获取部门列表（级联格式）
 * GET /api/departments
 * 
 * 查询参数：
 * - format: 'cascader' | 'list' (默认: 'cascader')
 *   - cascader: 返回三级级联格式，用于级联选择器
 *   - list: 返回原始部门列表 
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "cascader";

    if (format === "cascader") {
      // 返回三级级联格式
      const options = await getDepartmentCascaderOptions();
      return NextResponse.json({
        success: true,
        data: options,
      });
    } else {
      // 返回原始部门列表
      const departments = await getAllDepartments();
      return NextResponse.json({
        success: true,
        data: departments,
      });
    }
  } catch (error) {
    return handleApiError(error, "获取部门列表失败");
  }
}

