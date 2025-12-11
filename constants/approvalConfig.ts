/**
 * 审批相关常量配置
 */

import { ApprovalStatus, UserRole } from "@/types/approval";

/**
 * 审批状态选项配置
 */
export const APPROVAL_STATUS_OPTIONS = [
  { label: "草稿", value: ApprovalStatus.DRAFT },
  { label: "待审批", value: ApprovalStatus.PENDING },
  { label: "已通过", value: ApprovalStatus.APPROVED },
  { label: "已拒绝", value: ApprovalStatus.REJECTED },
] as const;

/**
 * 审批状态映射
 */
export const APPROVAL_STATUS_MAP: Record<string, string> = {
  [ApprovalStatus.DRAFT]: "草稿",
  [ApprovalStatus.PENDING]: "待审批",
  [ApprovalStatus.APPROVED]: "已通过",
  [ApprovalStatus.REJECTED]: "已拒绝",
} as const;

/**
 * 用户角色选项配置
 */
export const USER_ROLE_OPTIONS = [
  { label: "申请人", value: UserRole.APPLICANT },
  { label: "审批人", value: UserRole.APPROVER },
] as const;

/**
 * 表单项布局配置
 */
export const FORM_ITEM_LAYOUT = {
  labelCol: {
    span: 2,
  },
  wrapperCol: {
    span: 8,
  },
} as const;