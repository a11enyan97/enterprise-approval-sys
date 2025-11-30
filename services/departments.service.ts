import { prisma } from "@/prisma/db";
import { serialize } from "./_shared/utils";

/**
 * 树形选择器选项类型
 */
export interface CascaderOption {
  title?: string;
  key?: string;
  children?: CascaderOption[];
}

/**
 * 获取所有部门（树形结构）
 * @returns 部门列表
 */
export async function getAllDepartments() {
  // 获取所有启用的部门
  const allDepartments = await prisma.department.findMany({
    where: {
      status: 1, // 只获取启用状态的部门
    },
    orderBy: [
      { level: "asc" },
      { sortOrder: "asc" },
      { id: "asc" },
    ],
  });

  // 构建部门树
  const departmentMap = new Map<number, any>();
  const rootDepartments: any[] = [];

  // 第一遍：创建所有部门的映射
  allDepartments.forEach((dept) => {
    departmentMap.set(dept.id, {
      ...dept,
      children: [],
    });
  });

  // 第二遍：构建父子关系
  allDepartments.forEach((dept) => {
    const deptNode = departmentMap.get(dept.id)!;
    if (dept.parentId === null) {
      // 根节点（一级部门）
      rootDepartments.push(deptNode);
    } else {
      // 子节点
      const parent = departmentMap.get(dept.parentId);
      if (parent) {
        parent.children.push(deptNode);
      }
    }
  });

  return serialize(rootDepartments);
}

/**
 * 将部门数据转换为三级级联格式
 * @param departments 部门树（根节点数组）
 * @returns 级联选择器选项数组
 */
export function convertToCascaderOptions(
  departments: any[]
): CascaderOption[] {
  return departments.map((dept) => {
    const option: CascaderOption = {
      title: dept.deptName, // TreeSelect 使用 title 字段
      key: String(dept.id), // TreeSelect 使用 key 字段
    };

    // 处理二级部门（children 中的部门）
    if (dept.children && dept.children.length > 0) {
      option.children = dept.children.map((level2Dept: any) => {
        const level2Option: CascaderOption = {
          title: level2Dept.deptName,
          key: String(level2Dept.id),
        };

        // 处理三级部门（二级部门的 children）
        if (level2Dept.children && level2Dept.children.length > 0) {
          level2Option.children = level2Dept.children.map((level3Dept: any) => ({
            title: level3Dept.deptName,
            key: String(level3Dept.id),
          }));
        }

        return level2Option;
      });
    }

    return option;
  });
}

/**
 * 获取部门级联选项
 * @returns 三级部门级联选项数组
 */
export async function getDepartmentCascaderOptions(): Promise<
  CascaderOption[]
> {
  const departments = await getAllDepartments();
  return convertToCascaderOptions(departments);
}

