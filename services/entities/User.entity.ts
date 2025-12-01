/**
 * 用户实体类
 * 对应数据库表：users
 */
export enum UserRole {
  /** 申请人 */
  APPLICANT = 'applicant',
  /** 审批人 */
  APPROVER = 'approver',
}

/**
 * 用户实体类
 */
export class User {
  /** 用户ID，主键 */
  id: number;

  /** 用户名，唯一标识 */
  username: string;

  /** 密码哈希值 */
  passwordHash: string;

  /** 用户角色 */
  role: UserRole;

  /** 真实姓名 */
  realName: string;

  /** 主部门ID */
  primaryDeptId: number | null;

  /** 状态：1-启用，0-禁用 */
  status: number;

  /** 创建时间 */
  createdAt: Date;

  /** 更新时间 */
  updatedAt: Date;

  // 关系字段（可选，用于包含关联数据）
  /** 主部门 */
  primaryDept?: any; // Department 类型，避免循环依赖

  /** 审批申请列表 */
  approvals?: any[]; // ApprovalRequest[] 类型

  /** 审批附件列表 */
  approvalAttachments?: any[]; // ApprovalAttachment[] 类型

  /** 管理的部门列表 */
  managedDepartments?: any[]; // Department[] 类型

  /** 用户部门关联列表 */
  userDepartments?: any[]; // UserDepartment[] 类型

  constructor(data: Partial<User> = {}) {
    this.id = data.id ?? 0;
    this.username = data.username ?? '';
    this.passwordHash = data.passwordHash ?? '';
    this.role = data.role ?? UserRole.APPLICANT;
    this.realName = data.realName ?? '';
    this.primaryDeptId = data.primaryDeptId ?? null;
    this.status = data.status ?? 1;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();

    if (data.primaryDept !== undefined) this.primaryDept = data.primaryDept;
    if (data.approvals !== undefined) this.approvals = data.approvals;
    if (data.approvalAttachments !== undefined) this.approvalAttachments = data.approvalAttachments;
    if (data.managedDepartments !== undefined) this.managedDepartments = data.managedDepartments;
    if (data.userDepartments !== undefined) this.userDepartments = data.userDepartments;
  }

  /**
   * 判断是否为申请人
   */
  isApplicant(): boolean {
    return this.role === UserRole.APPLICANT;
  }

  /**
   * 判断是否为审批人
   */
  isApprover(): boolean {
    return this.role === UserRole.APPROVER;
  }

  /**
   * 判断用户是否启用
   */
  isEnabled(): boolean {
    return this.status === 1;
  }
}

