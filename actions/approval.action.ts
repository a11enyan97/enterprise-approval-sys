"use server";

import {
  createApprovalRequest,
  getApprovalRequestList,
  getApprovalRequestById,
  submitApprovalRequest,
  approveOrRejectRequest,
  deleteApprovalRequest,
} from "@/services/approval.service";
import { getFormSchema } from "@/services/form-config.service";
import { handleActionError } from "@/services/_shared/errors";
import type { CreateApprovalRequestInput, GetApprovalListParams } from "@/types/approval";
import type { FormSchema } from "@/types/form";

/**
 * 创建审批申请
 * 
 * @param params - 审批申请数据
 * @param params.projectName - 审批项目名称（必填）
 * @param params.approvalContent - 审批内容（可选，≤300字）
 * @param params.deptId - 部门ID（可选，服务端会自动构建完整路径）
 * @param params.executeDate - 执行日期（必填，ISO 8601 格式）
 * @param params.applicantId - 申请人ID（必填）
 * @param params.attachments - 附件列表（可选）
 * @returns 返回创建结果，成功时包含创建的审批申请数据
 */
export async function createApprovalAction(params: CreateApprovalRequestInput) {
  try {
    const approval = await createApprovalRequest(params);
    return {
      success: true,
      data: approval,
    };
  } catch (error) {
    const errorResponse = handleActionError(error, "创建审批申请失败");
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
    const errorResponse = handleActionError(error, "删除审批申请失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 获取审批申请列表
 * 
 * @param params - 查询参数（可选）
 * @param params.page - 页码（默认：1）
 * @param params.pageSize - 每页数量（默认：10）
 * @param params.applicantId - 按申请人ID过滤（可选）
 * @param params.status - 按状态过滤（可选）
 * @param params.deptId - 按部门ID过滤（可选，会查询该部门及其子部门）
 * @param params.projectName - 项目名称模糊查询（可选）
 * @param params.createTimeStart - 创建时间开始（可选，ISO 8601）
 * @param params.createTimeEnd - 创建时间结束（可选，ISO 8601）
 * @returns 返回分页列表数据
 */
export async function getApprovalListAction(params?: GetApprovalListParams) {
  try {
    const result = await getApprovalRequestList(params);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorResponse = handleActionError(error, "获取审批申请列表失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 获取审批申请详情
 * 
 * @param requestId - 审批申请ID（BigInt 转字符串）
 * @returns 返回审批申请详情，如果不存在则返回 NOT_FOUND 错误
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
    const errorResponse = handleActionError(error, "获取审批申请详情失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 获取审批表单配置
 */
export async function getApprovalFormSchemaAction(
  formKey: string
): Promise<{ success: boolean; data?: FormSchema; error?: string; code?: string; details?: string }> {
  try {
    const schema = await getFormSchema(formKey);
    return {
      success: true,
      data: schema,
    };
  } catch (error) {
    const errorResponse = handleActionError(error, "获取审批表单配置失败");
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
    const errorResponse = handleActionError(error, "提交审批申请失败");
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
    const errorResponse = handleActionError(error, "审批操作失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}


