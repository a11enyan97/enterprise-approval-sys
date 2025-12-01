"use server";

import {
  createApprovalRequest,
  getApprovalRequestList,
  getApprovalRequestById,
  submitApprovalRequest,
  approveOrRejectRequest,
  deleteApprovalRequest,
} from "@/services/approval.service";
import { handleApiError } from "@/services/_shared/errors";
import type { CreateApprovalRequestInput, GetApprovalListParams } from "@/types/approval";

/**
 * 创建审批申请
 */
export async function createApprovalAction(params: CreateApprovalRequestInput) {
  try {
    const approval = await createApprovalRequest(params);
    return {
      success: true,
      data: approval,
    };
  } catch (error) {
    const errorResponse = handleApiError(error, "创建审批申请失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 删除审批申请
 */
export async function deleteApprovalAction(requestId: string) {
  try {
    const deleted = await deleteApprovalRequest(BigInt(requestId));
    return {
      success: true,
      data: deleted,
    };
  } catch (error) {
    const errorResponse = handleApiError(error, "删除审批申请失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 获取审批申请列表
 */
export async function getApprovalListAction(params?: GetApprovalListParams) {
  try {
    const result = await getApprovalRequestList(params);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorResponse = handleApiError(error, "获取审批申请列表失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 获取审批申请详情
 */
export async function getApprovalDetailAction(requestId: string) {
  try {
    const approval = await getApprovalRequestById(BigInt(requestId));

    if (!approval) {
      return {
        success: false,
        error: "审批申请不存在",
        code: "NOT_FOUND",
      };
    }

    return {
      success: true,
      data: approval,
    };
  } catch (error) {
    const errorResponse = handleApiError(error, "获取审批申请详情失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 提交审批申请
 */
export async function submitApprovalAction(requestId: string, data: any) {
  try {
    const approval = await submitApprovalRequest(BigInt(requestId), data);
    return {
      success: true,
      data: approval,
    };
  } catch (error) {
    const errorResponse = handleApiError(error, "提交审批申请失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 审批申请（同意或拒绝）
 */
export async function approveOrRejectAction(
  requestId: string,
  action: "approve" | "reject",
  approverId: number
) {
  try {
    if (!action || (action !== "approve" && action !== "reject")) {
      return {
        success: false,
        error: "无效的审批操作，action 必须是 'approve' 或 'reject'",
        code: "INVALID_ACTION",
      };
    }

    if (!approverId) {
      return {
        success: false,
        error: "缺少必要参数 approverId",
        code: "MISSING_PARAMETER",
      };
    }

    const approval = await approveOrRejectRequest(
      BigInt(requestId),
      action,
      approverId
    );

    return {
      success: true,
      data: approval,
    };
  } catch (error) {
    const errorResponse = handleApiError(error, "审批操作失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}


