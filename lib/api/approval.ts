/**
 * 审批申请相关 API
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./client";
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
  const response = await apiGet<ApprovalRequestListResponse>(
    "/api/approval",
    params as Record<string, string | number | undefined>
  );

  if (!response.success || !response.data) {
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
  const response = await apiGet<ApprovalRequestItem>(
    `/api/approval/${requestId}`
  );

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
  const response = await apiPost<ApprovalRequestItem>("/api/approval", data);

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
  const response = await apiPut<ApprovalRequestItem>(
    `/api/approval/${requestId}`,
    data
  );

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
  const response = await apiPatch<ApprovalRequestItem>(
    `/api/approval/${requestId}`,
    {
      action,
      approverId,
    }
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
  const response = await apiDelete<ApprovalRequestItem>(
    `/api/approval/${requestId}`
  );

  if (!response.success) {
    throw new Error(response.error || "删除审批申请失败");
  }

  return response.data as ApprovalRequestItem;
}

