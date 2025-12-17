"use server";

import {
  createFormTemplate,
  updateFormTemplate,
  getFormTemplateByKey,
  getFormTemplateById,
  getFormTemplateList,
} from "@/services/form-template.service";
import {
  createFormSubmission,
  getFormSubmissionById,
  getFormSubmissionList,
  updateFormSubmissionStatus,
} from "@/services/form-submission.service";
import { handleActionError } from "@/services/_shared/errors";
import type { FormSchema } from "@/types/formBuilder";
import type { AttachmentInput } from "@/types/approval";
import { cleanFormData } from "@/utils/formatUtils";
/**
 * 创建表单模板
 * @param params 表单模板数据
 * @returns 创建结果
 */
export async function createFormTemplateAction(params: {
  key: string;
  name: string;
  description?: string;
  schema: FormSchema;
  createdBy?: number;
  isPublished?: boolean;
}) {
  try {
    const template = await createFormTemplate(params);
    return {
      success: true,
      data: template,
    };
  } catch (error) {
    const errorResponse = handleActionError(error, "创建表单模板失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 更新表单模板
 * @param templateId 模板ID
 * @param params 更新数据
 * @returns 更新结果
 */
export async function updateFormTemplateAction(
  templateId: string,
  params: {
    name?: string;
    description?: string;
    schema?: FormSchema;
    isPublished?: boolean;
  }
) {
  try {
    const template = await updateFormTemplate(templateId, params);
    return {
      success: true,
      data: template,
    };
  } catch (error) {
    const errorResponse = handleActionError(error, "更新表单模板失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 根据 key 获取表单模板
 * @param key 表单 key
 * @returns 模板数据
 */
export async function getFormTemplateByKeyAction(key: string) {
  try {
    const template = await getFormTemplateByKey(key);
    if (!template) {
      return {
        success: false,
        error: "表单模板不存在",
        code: "TEMPLATE_NOT_FOUND",
      };
    }
    return {
      success: true,
      data: template,
    };
  } catch (error) {
    const errorResponse = handleActionError(error, "获取表单模板失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 根据 ID 获取表单模板
 * @param templateId 模板ID
 * @returns 模板数据
 */
export async function getFormTemplateByIdAction(templateId: string) {
  try {
    const template = await getFormTemplateById(templateId);
    if (!template) {
      return {
        success: false,
        error: "表单模板不存在",
        code: "TEMPLATE_NOT_FOUND",
      };
    }
    return {
      success: true,
      data: template,
    };
  } catch (error) {
    const errorResponse = handleActionError(error, "获取表单模板失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 获取表单模板列表
 * @param params 查询参数
 * @returns 模板列表
 */
export async function getFormTemplateListAction(params?: {
  isPublished?: boolean;
  createdBy?: number;
  page?: number;
  pageSize?: number;
}) {
  try {
    const result = await getFormTemplateList(params);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorResponse = handleActionError(error, "获取表单模板列表失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 提交表单并创建审批请求（整合流程）
 * 1. 保存 FormSubmission（包含 JSON 数据和 schema 快照）
 * 2. 从 JSON 数据中提取关键信息（项目名称、申请部门等）
 * 3. 创建 ApprovalRequest，关联 submissionId
 * 
 * @param params 表单提交数据
 * @param params.templateId 表单模板ID
 * @param params.data 表单提交的 JSON 数据
 * @param params.submittedBy 提交人ID
 * @param params.schema 表单 schema（用于提取关键信息）
 * @param params.attachments 附件列表（可选）
 * @returns 创建结果，包含 submission 和 approval
 */
export async function submitFormWithApprovalAction(params: {
  templateId: string;
  data: Record<string, any>;
  submittedBy: number;
  schema: FormSchema;
  status: "PENDING" | "APPROVED" | "REJECTED";
  attachments?: AttachmentInput[];
}) {
  try {
    // 导入提取工具函数
    const { extractApprovalInfo } = await import("@/utils/formDataExtractor");
    // 引入表单提交服务
    const { createFormSubmissionWithApproval } = await import("@/services/form-submission.service");

    // 1. 从表单数据中提取关键信息
    const approvalInfo = extractApprovalInfo(params.data, params.schema);
    console.log("清洗前表单数据：",params.data);
    // 清理表单数据，移除不可序列化的字段
    const cleanedData = cleanFormData(params.data);
    console.log("清洗后表单数据：",cleanedData);
    // 2. 创建表单提交记录并关联审批请求
    const result = await createFormSubmissionWithApproval({
      templateId: params.templateId,
      data: cleanedData,
      submittedBy: params.submittedBy,
      status: params.status,
      approvalRequestData: {
        ...approvalInfo,
        attachments: params.attachments,
      },
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.log(error);
    
    const errorResponse = handleActionError(error, "提交表单并创建审批请求失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 根据 ID 获取表单提交记录
 * @param submissionId 提交记录ID
 * @returns 提交记录数据
 */
export async function getFormSubmissionByIdAction(submissionId: string) {
  try {
    const submission = await getFormSubmissionById(submissionId);
    if (!submission) {
      return {
        success: false,
        error: "表单提交记录不存在",
        code: "SUBMISSION_NOT_FOUND",
      };
    }
    return {
      success: true,
      data: submission,
    };
  } catch (error) {
    const errorResponse = handleActionError(error, "获取表单提交记录失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 获取表单提交记录列表
 * @param params 查询参数
 * @returns 提交记录列表
 */
export async function getFormSubmissionListAction(params?: {
  templateId?: string;
  submittedBy?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  page?: number;
  pageSize?: number;
}) {
  try {
    const result = await getFormSubmissionList(params);
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorResponse = handleActionError(error, "获取表单提交记录列表失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 更新表单提交状态（审批）
 * @param submissionId 提交记录ID
 * @param status 新状态
 * @returns 更新结果
 */
export async function updateFormSubmissionStatusAction(
  submissionId: string,
  status: "PENDING" | "APPROVED" | "REJECTED"
) {
  try {
    const submission = await updateFormSubmissionStatus(submissionId, status);
    return {
      success: true,
      data: submission,
    };
  } catch (error) {
    const errorResponse = handleActionError(error, "更新表单提交状态失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * 更新表单提交记录并同步更新审批请求
 * 用于编辑审批申请
 */
export async function updateFormSubmissionWithApprovalAction(
  submissionId: string,
  params: {
    data: Record<string, any>;
    schema: FormSchema;
    attachments?: AttachmentInput[];
    updatedBy: number;
  }
) {
  try {
    const { extractApprovalInfo } = await import("@/utils/formDataExtractor");
    const { updateFormSubmissionWithApproval } = await import("@/services/form-submission.service");

    // 1. 提取信息
    const approvalInfo = extractApprovalInfo(params.data, params.schema);

    // 清洗数据
    const cleanedData = cleanFormData(params.data);

    // 2. 调用服务更新
    const result = await updateFormSubmissionWithApproval(submissionId, {
      data: cleanedData,
      approvalRequestData: {
        ...approvalInfo,
        attachments: params.attachments,
      },
      updaterId: params.updatedBy
    });

    return {
      success: true,
      data: result
    };

  } catch (error) {
    const errorResponse = handleActionError(error, "更新表单提交失败");
    return {
      success: false,
      ...errorResponse
    };
  }
}
