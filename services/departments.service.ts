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

/**
 * 部门路径信息
 */
export interface DepartmentPathInfo {
  deptLevel1Id: number | null;
  deptLevel2Id: number | null;
  deptLevel3Id: number | null;
  deptFullPath: string;
}

/**
 * 根据部门ID查找完整路径和层级信息
 * @param deptId 部门ID
 * @returns 部门路径信息，如果部门不存在则返回 null
 */
export async function getDepartmentPathInfo(
  deptId: number | string | null | undefined
): Promise<DepartmentPathInfo | null> {
  if (!deptId) {
    return null;
  }

  const id = typeof deptId === "string" ? parseInt(deptId) : deptId;
  if (isNaN(id)) {
    return null;
  }

  // 查找部门及其所有父级部门
  const path: Array<{ id: number; deptName: string; level: number }> = [];
  let currentDeptId: number | null = id;

  // 向上查找直到根节点
  while (currentDeptId !== null) {
    const dept: {
      id: number;
      deptName: string;
      level: number;
      parentId: number | null;
    } | null = await prisma.department.findUnique({
      where: { id: currentDeptId },
      select: {
        id: true,
        deptName: true,
        level: true,
        parentId: true,
      },
    });

    if (!dept) {
      return null; // 部门不存在
    }

    path.unshift({
      id: dept.id,
      deptName: dept.deptName,
      level: dept.level,
    });

    currentDeptId = dept.parentId;
  }

  // 根据路径长度确定各层级ID
  let deptLevel1Id: number | null = null;
  let deptLevel2Id: number | null = null;
  let deptLevel3Id: number | null = null;

  // 根据level字段确定层级
  for (const dept of path) {
    if (dept.level === 1) {
      deptLevel1Id = dept.id;
    } else if (dept.level === 2) {
      deptLevel2Id = dept.id;
    } else if (dept.level === 3) {
      deptLevel3Id = dept.id;
    }
  }

  // 构建完整路径
  const deptFullPath = path.map((dept) => dept.deptName).join("/");

  return {
    deptLevel1Id,
    deptLevel2Id,
    deptLevel3Id,
    deptFullPath,
  };
}

