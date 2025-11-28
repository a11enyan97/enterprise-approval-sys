/**
 * 审批申请相关 API（使用 Server Actions）
 */

import {
  createApprovalAction,
  getApprovalListAction,
  getApprovalDetailAction,
  submitApprovalAction,
  approveOrRejectAction,
  deleteApprovalAction,
} from "@/actions/approval.action";
import type {
  ApprovalRequestListResponse,
  GetApprovalListParams,
} from "@/types/approval";
import type { ApprovalRequestItem } from "@/types/approval";

/**
 * 获取审批申请列表
 */
export async function getApprovalList(
  params?: GetApprovalListParams
): Promise<ApprovalRequestListResponse> {
  const response = await getApprovalListAction(params);

  if (!response.success) {
    throw new Error(response.error || "获取审批列表失败");
  }

  return response.data;
}

/**
 * 获取审批申请详情
 */
export async function getApprovalDetail(
  requestId: string | number
): Promise<ApprovalRequestItem> {
  const response = await getApprovalDetailAction(String(requestId));

  if (!response.success || !response.data) {
    throw new Error(response.error || "获取审批详情失败");
  }

  return response.data;
}

/**
 * 创建审批申请
 */
export async function createApprovalRequest(
  data: any
): Promise<ApprovalRequestItem> {
  const response = await createApprovalAction(data);

  if (!response.success || !response.data) {
    throw new Error(response.error || "创建审批申请失败");
  }

  return response.data;
}

/**
 * 提交审批申请
 */
export async function submitApprovalRequest(
  requestId: string | null,
  data: any
): Promise<ApprovalRequestItem> {
  if (!requestId) {
    throw new Error("审批申请ID不能为空");
  }

  const response = await submitApprovalAction(requestId, data);

  if (!response.success || !response.data) {
    throw new Error(response.error || "提交审批申请失败");
  }

  return response.data;
}

/**
 * 审批（同意或拒绝）
 */
export async function approveOrRejectApprovalRequest(
  requestId: string | number,
  action: "approve" | "reject",
  approverId: number
): Promise<ApprovalRequestItem> {
  const response = await approveOrRejectAction(
    String(requestId),
    action,
    approverId
  );

  if (!response.success || !response.data) {
    throw new Error(response.error || "审批操作失败");
  }

  return response.data;
}

/**
 * 删除审批申请
 */
export async function deleteApprovalRequest(
  requestId: string | number
): Promise<ApprovalRequestItem> {
  const response = await deleteApprovalAction(String(requestId));

  if (!response.success) {
    throw new Error(response.error || "删除审批申请失败");
  }

  return response.data as ApprovalRequestItem;
}

