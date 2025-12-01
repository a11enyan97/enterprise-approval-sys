/**
 * 审批申请相关类型定义
 */

/**
 * 审批状态枚举
 */
export enum ApprovalStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

/**
 * 审批附件项
 */
export interface ApprovalAttachmentItem {
  id: string;
  requestId: string;
  attachmentType: "image" | "table";
  fileName: string;
  filePath: string;
  fileSize: string;
  mimeType?: string | null;
  uploaderId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 审批申请列表项
 */
export interface ApprovalRequestItem {
  id: string;
  requestNo: string;
  projectName: string;
  approvalContent?: string;
  deptFullPath?: string;
  deptLevel1Id?: number;
  deptLevel2Id?: number;
  deptLevel3Id?: number;
  executeDate: string;
  createdAt: string;
  submittedAt?: string | null;
  completedAt?: string | null;
  currentStatus: ApprovalStatus;
  applicantId: number;
  updatedAt: string;
  applicant: {
    id: number;
    realName: string;
  };
  attachments?: ApprovalAttachmentItem[];
}

/**
 * 审批申请列表响应
 */
export interface ApprovalRequestListResponse {
  data: ApprovalRequestItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


/**
 * 获取审批列表的查询参数
 */
export interface GetApprovalListParams {
  page?: number;
  pageSize?: number;
  applicantId?: number;
  status?: ApprovalStatus | string;
  deptLevel1Id?: number;
  deptLevel2Id?: number;
  deptLevel3Id?: number;
}

/**
 * 创建审批申请的输入参数
 */
export interface CreateApprovalRequestInput {
  projectName: string;
  approvalContent?: string;
  deptId?: number | string | null;
  deptFullPath?: string;
  deptLevel1Id?: number | null;
  deptLevel2Id?: number | null;
  deptLevel3Id?: number | null;
  executeDate: string | Date;
  applicantId: number;
}

/**
 * 提交/更新审批申请的可更新字段
 */
export interface SubmitApprovalRequestInput
  extends Partial<Omit<CreateApprovalRequestInput, "applicantId">> {
  deptId?: number | string | null;
  currentStatus?: "draft" | "pending" | "approved" | "rejected";
}