/**
 * 审批状态枚举
 */
export enum ApprovalStatus {
  /** 草稿 */
  DRAFT = 'draft',
  /** 待审批 */
  PENDING = 'pending',
  /** 已通过 */
  APPROVED = 'approved',
  /** 已拒绝 */
  REJECTED = 'rejected',
}

/**
 * 审批申请实体类
 * 对应数据库表：approval_requests
 */
export class ApprovalRequest {
  /** 审批申请ID，主键 */
  id: string; // BigInt 转为 string

  /** 审批单号，唯一标识 */
  requestNo: string;

  /** 审批项目名称 */
  projectName: string;

  /** 审批内容，限制300字 */
  approvalContent: string | null;

  /** 部门完整路径，如：A部门/B子部门/C团队 */
  deptFullPath: string | null;

  /** 一级部门ID */
  deptLevel1Id: number | null;

  /** 二级部门ID */
  deptLevel2Id: number | null;

  /** 三级部门ID */
  deptLevel3Id: number | null;

  /** 执行日期 */
  executeDate: Date;

  /** 创建时间 */
  createdAt: Date;

  /** 提交时间 */
  submittedAt: Date | null;

  /** 完成时间（审批完成时间） */
  completedAt: Date | null;

  /** 当前审批状态 */
  currentStatus: ApprovalStatus;

  /** 申请人ID */
  applicantId: number;

  /** 更新时间 */
  updatedAt: Date;

  // 关系字段（可选，用于包含关联数据）
  /** 申请人 */
  applicant?: any; // User 类型

  /** 一级部门 */
  level1Dept?: any; // Department 类型

  /** 二级部门 */
  level2Dept?: any; // Department 类型

  /** 三级部门 */
  level3Dept?: any; // Department 类型

  /** 附件列表 */
  attachments?: any[]; // ApprovalAttachment[] 类型

  constructor(data: Partial<ApprovalRequest> = {}) {
    this.id = data.id ?? '0';
    this.requestNo = data.requestNo ?? '';
    this.projectName = data.projectName ?? '';
    this.approvalContent = data.approvalContent ?? null;
    this.deptFullPath = data.deptFullPath ?? null;
    this.deptLevel1Id = data.deptLevel1Id ?? null;
    this.deptLevel2Id = data.deptLevel2Id ?? null;
    this.deptLevel3Id = data.deptLevel3Id ?? null;
    this.executeDate = data.executeDate ?? new Date();
    this.createdAt = data.createdAt ?? new Date();
    this.submittedAt = data.submittedAt ?? null;
    this.completedAt = data.completedAt ?? null;
    this.currentStatus = data.currentStatus ?? ApprovalStatus.DRAFT;
    this.applicantId = data.applicantId ?? 0;
    this.updatedAt = data.updatedAt ?? new Date();

    if (data.applicant !== undefined) this.applicant = data.applicant;
    if (data.level1Dept !== undefined) this.level1Dept = data.level1Dept;
    if (data.level2Dept !== undefined) this.level2Dept = data.level2Dept;
    if (data.level3Dept !== undefined) this.level3Dept = data.level3Dept;
    if (data.attachments !== undefined) this.attachments = data.attachments;
  }

  /**
   * 判断是否为草稿状态
   */
  isDraft(): boolean {
    return this.currentStatus === ApprovalStatus.DRAFT;
  }

  /**
   * 判断是否为待审批状态
   */
  isPending(): boolean {
    return this.currentStatus === ApprovalStatus.PENDING;
  }

  /**
   * 判断是否已通过
   */
  isApproved(): boolean {
    return this.currentStatus === ApprovalStatus.APPROVED;
  }

  /**
   * 判断是否已拒绝
   */
  isRejected(): boolean {
    return this.currentStatus === ApprovalStatus.REJECTED;
  }

  /**
   * 判断是否已完成（已通过或已拒绝）
   */
  isCompleted(): boolean {
    return this.isApproved() || this.isRejected();
  }

  /**
   * 判断是否可以编辑（只有草稿状态可以编辑）
   */
  canEdit(): boolean {
    return this.isDraft();
  }

  /**
   * 判断是否可以提交（只有草稿状态可以提交）
   */
  canSubmit(): boolean {
    return this.isDraft();
  }

  /**
   * 判断是否可以审批（只有待审批状态可以审批）
   */
  canApprove(): boolean {
    return this.isPending();
  }
}

