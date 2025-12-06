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
 * 用户角色枚举
 */
export enum UserRole {
  APPLICANT = "applicant",
  APPROVER = "approver",
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
  deptId?: number; // 部门ID（前端只需传一个部门ID，服务端会根据该ID查询该部门及其子部门）
  projectName?: string; // 项目名称（模糊查询）
  createTimeStart?: string; // 创建时间开始（ISO 8601 格式）
  createTimeEnd?: string; // 创建时间结束（ISO 8601 格式）
  approvalTimeStart?: string; // 审批时间开始（ISO 8601 格式）
  approvalTimeEnd?: string; // 审批时间结束（ISO 8601 格式）
}

/**
 * 附件输入参数
 */
export interface AttachmentInput {
  filePath: string;
  fileName: string;
  attachmentType: 'image' | 'table';
  fileSize?: number | string; // 文件大小（字节），可以是数字或字符串（BigInt）
  mimeType?: string | null; // MIME 类型
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
  attachments?: AttachmentInput[]; // 附件列表
}

/**
 * 提交/修改审批申请的可更新字段
 */
export interface SubmitApprovalRequestInput
  extends Partial<Omit<CreateApprovalRequestInput, "applicantId">> {
  currentStatus?: "draft" | "pending" | "approved" | "rejected";
  attachments?: AttachmentInput[]; // 附件列表（编辑时使用）
}