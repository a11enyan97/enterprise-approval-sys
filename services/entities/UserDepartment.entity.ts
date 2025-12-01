/**
 * 用户部门关联实体类
 * 对应数据库表：user_departments
 */
export class UserDepartment {
  /** 关联ID，主键 */
  id: string; // BigInt 转为 string

  /** 用户ID */
  userId: number;

  /** 部门ID */
  deptId: number;

  /** 是否为主部门：1-是，0-否 */
  isPrimary: number;

  /** 职位 */
  position: string | null;

  /** 职称 */
  jobTitle: string | null;

  /** 创建时间 */
  createdAt: Date;

  /** 更新时间 */
  updatedAt: Date;

  // 关系字段（可选，用于包含关联数据）
  /** 用户 */
  user?: any; // User 类型

  /** 部门 */
  department?: any; // Department 类型

  constructor(data: Partial<UserDepartment> = {}) {
    this.id = data.id ?? '0';
    this.userId = data.userId ?? 0;
    this.deptId = data.deptId ?? 0;
    this.isPrimary = data.isPrimary ?? 1;
    this.position = data.position ?? null;
    this.jobTitle = data.jobTitle ?? null;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();

    if (data.user !== undefined) this.user = data.user;
    if (data.department !== undefined) this.department = data.department;
  }

  /**
   * 判断是否为主部门
   */
  isPrimaryDept(): boolean {
    return this.isPrimary === 1;
  }
}

