import { prisma } from "@/prisma/db";

/**
 * 数据库验证错误类
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * 验证用户是否存在
 * @param userId 用户ID
 * @throws ValidationError 如果用户不存在
 */
export async function validateUserExists(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new ValidationError(
      `用户ID ${userId} 不存在`,
      "applicantId",
      "USER_NOT_FOUND"
    );
  }
}

/**
 * 验证部门是否存在
 * @param deptId 部门ID
 * @param level 部门级别 (1, 2, 3)
 * @throws ValidationError 如果部门不存在
 */
export async function validateDepartmentExists(
  deptId: number | null | undefined,
  level: 1 | 2 | 3
): Promise<void> {
  if (!deptId) {
    return; // 允许为空
  }

  const dept = await prisma.department.findUnique({
    where: { id: deptId },
    select: { id: true },
  });

  if (!dept) {
    throw new ValidationError(
      `${level}级部门ID ${deptId} 不存在`,
      `deptLevel${level}Id`,
      "DEPARTMENT_NOT_FOUND"
    );
  }
}

/**
 * 批量验证部门（用于三级级联部门）
 * @param deptLevel1Id 一级部门ID
 * @param deptLevel2Id 二级部门ID
 * @param deptLevel3Id 三级部门ID
 */
export async function validateDepartments(
  deptLevel1Id?: number | null,
  deptLevel2Id?: number | null,
  deptLevel3Id?: number | null
): Promise<void> {
  if (deptLevel1Id) {
    await validateDepartmentExists(deptLevel1Id, 1);
  }
  if (deptLevel2Id) {
    await validateDepartmentExists(deptLevel2Id, 2);
  }
  if (deptLevel3Id) {
    await validateDepartmentExists(deptLevel3Id, 3);
  }
}

