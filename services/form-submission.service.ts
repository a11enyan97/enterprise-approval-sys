import { prisma } from "@/prisma/db";
import { Prisma } from "@/generated/prisma/client";
import { ValidationError } from "./_shared/validators";
import { serialize } from "./_shared/utils";
import type { AttachmentInput } from "@/types/approval";

/**
 * 创建表单提交记录
 * @param input 表单提交数据
 * @returns 创建的提交记录
 */
export async function createFormSubmission(input: {
  templateId: string;
  data: Record<string, any>;
  submittedBy: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
}, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;

  // 1. 验证必填字段
  if (!input.templateId || !input.submittedBy) {
    throw new ValidationError("模板ID和提交人ID不能为空", "templateId/submittedBy", "MISSING_REQUIRED_FIELDS");
  }

  // 2. 检查提交数据对应的表单模板是否存在
  const template = await db.formTemplate.findUnique({
    where: { id: input.templateId },
  });

  if (!template) {
    throw new ValidationError(`表单模板 ${input.templateId} 不存在`, "templateId", "TEMPLATE_NOT_FOUND");
  }

  // 3. 检查模板是否已发布
  if (!template.isPublished) {
    throw new ValidationError("该表单模板尚未发布，无法提交", "templateId", "TEMPLATE_NOT_PUBLISHED");
  }

  // 4. 验证提交数据格式
  if (!input.data || typeof input.data !== "object") {
    throw new ValidationError("提交数据格式不正确", "data", "INVALID_DATA_FORMAT");
  }

  // 5. 创建提交记录
  const submission = await db.formSubmission.create({
    data: {
      templateId: input.templateId,
      schemaSnapshot: template.schema as any, // 保存提交时的表单模板 schema 快照
      data: input.data as any, // 保存提交时的表单数据
      submittedBy: input.submittedBy,
      status: input.status || "PENDING",
    },
    include: {
      template: {
        select: {
          id: true,
          key: true,
          name: true,
        },
      },
      submitter: {
        select: {
          id: true,
          realName: true,
          username: true,
        },
      },
    },
  });

  return serialize(submission);
}

/**
 * 创建表单提交并关联审批请求（整合流程）
 * @param input 表单提交数据
 * @param approvalRequestData 审批请求数据（从表单数据中提取）
 * @returns 创建的提交记录和审批请求
 */
export async function createFormSubmissionWithApproval(input: {
  templateId: string;
  data: Record<string, any>;
  submittedBy: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  approvalRequestData: {
    projectName: string;
    approvalContent?: string;
    deptId?: number | string | null;
    executeDate?: Date | string;
    attachments?: AttachmentInput[];
  };
}) {
  const { approvalRequestData, ...submissionParams } = input;

  return await prisma.$transaction(async (tx) => {
    // 1. 创建表单提交记录
    const submission = await createFormSubmission(submissionParams, tx);

    // 2. 导入部门服务
    const { getDepartmentPathInfo } = await import("./departments.service");

    // 3. 处理部门信息
    let deptLevel1Id: number | null = null;
    let deptLevel2Id: number | null = null;
    let deptLevel3Id: number | null = null;
    let deptFullPath: string | null = null;

    if (approvalRequestData.deptId) {
      const deptPathInfo = await getDepartmentPathInfo(Number(approvalRequestData.deptId));
      if (deptPathInfo) {
        deptLevel1Id = deptPathInfo.deptLevel1Id;
        deptLevel2Id = deptPathInfo.deptLevel2Id;
        deptLevel3Id = deptPathInfo.deptLevel3Id;
        deptFullPath = deptPathInfo.deptFullPath;
      }
    }

    // 4. 处理执行日期
    const executeDate = approvalRequestData.executeDate
      ? approvalRequestData.executeDate instanceof Date
        ? approvalRequestData.executeDate
        : new Date(approvalRequestData.executeDate)
      : new Date();

    // 5. 创建审批请求，关联 submissionId
    const approval = await tx.approvalRequest.create({
      data: {
        requestNo: `APP${Date.now()}`,
        projectName: approvalRequestData.projectName,
        approvalContent: approvalRequestData.approvalContent || null,
        deptFullPath,
        deptLevel1Id,
        deptLevel2Id,
        deptLevel3Id,
        executeDate,
        applicantId: input.submittedBy,
        submissionId: submission.id, // 关联表单提交记录
        currentStatus: "draft", 
        submittedAt: new Date(),
      },
      include: {
        applicant: {
          select: {
            id: true,
            realName: true,
            username: true,
          },
        },
      },
    });

    // 6. 创建附件记录（如果有附件）
    if (approvalRequestData.attachments && approvalRequestData.attachments.length > 0) {
      await tx.approvalAttachment.createMany({
        data: approvalRequestData.attachments.map((att) => ({
          requestId: approval.id,
          attachmentType: att.attachmentType,
          fileName: att.fileName,
          filePath: att.filePath,
          fileSize: BigInt(att.fileSize || 0),
          mimeType: att.mimeType || null,
          uploaderId: input.submittedBy,
        })),
      });
    }

    // 7. 重新查询以包含完整信息
    const approvalWithAttachments = await tx.approvalRequest.findUnique({
      where: { id: approval.id },
      include: {
        applicant: {
          select: {
            id: true,
            realName: true,
            username: true,
          },
        },
        attachments: true,
      },
    });

    return {
      submission: serialize(submission),
      approval: serialize(approvalWithAttachments || approval),
    };
  });
}

/**
 * 更新表单提交并同步审批请求
 * @param submissionId 提交记录ID
 * @param input 更新数据
 * @returns 更新后的提交记录
 */
export async function updateFormSubmissionWithApproval(
  submissionId: string,
  input: {
    data: Record<string, any>;
    approvalRequestData: {
      projectName: string;
      approvalContent?: string;
      deptId?: number | string | null;
      executeDate?: Date | string;
      attachments?: AttachmentInput[];
    };
    updaterId: number;
  }
) {
  const { approvalRequestData } = input;

  return await prisma.$transaction(async (tx) => {
    // 1. 更新 FormSubmission表
    const submission = await tx.formSubmission.update({
      where: { id: submissionId },
      data: {
        data: input.data as any,
      },
      include: {
        template: {
            select: {
                id: true,
                key: true,
                name: true,
                schema: true,
            }
        }
      }
    });

    // 2. 找到关联的 ApprovalRequest
    const approvalRequest = await tx.approvalRequest.findFirst({
      where: { submissionId: submissionId },
    });

    if (!approvalRequest) {
      // 如果没有关联审批请求，是否要创建一个？
      // 这种情况很少见（除非数据不一致），这里抛出错误更安全
      throw new ValidationError("关联的审批请求不存在", "submissionId", "APPROVAL_NOT_FOUND");
    }

    // 3. 处理部门信息
    const { getDepartmentPathInfo } = await import("./departments.service");
    let deptLevel1Id: number | null = null;
    let deptLevel2Id: number | null = null;
    let deptLevel3Id: number | null = null;
    let deptFullPath: string | null = null;

    if (approvalRequestData.deptId) {
      const deptPathInfo = await getDepartmentPathInfo(Number(approvalRequestData.deptId));
      if (deptPathInfo) {
        deptLevel1Id = deptPathInfo.deptLevel1Id;
        deptLevel2Id = deptPathInfo.deptLevel2Id;
        deptLevel3Id = deptPathInfo.deptLevel3Id;
        deptFullPath = deptPathInfo.deptFullPath;
      }
    }

    // 4. 处理执行日期
    const executeDate = approvalRequestData.executeDate
      ? approvalRequestData.executeDate instanceof Date
        ? approvalRequestData.executeDate
        : new Date(approvalRequestData.executeDate)
      : new Date();

    // 5. 更新 ApprovalRequest
    await tx.approvalRequest.update({
      where: { id: approvalRequest.id },
      data: {
        projectName: approvalRequestData.projectName,
        approvalContent: approvalRequestData.approvalContent || null,
        deptFullPath,
        deptLevel1Id,
        deptLevel2Id,
        deptLevel3Id,
        executeDate,
        updatedAt: new Date(),
      },
    });

    // 6. 更新附件 (全量替换：先删后加)
    await tx.approvalAttachment.deleteMany({
      where: { requestId: approvalRequest.id },
    });

    if (approvalRequestData.attachments && approvalRequestData.attachments.length > 0) {
      await tx.approvalAttachment.createMany({
        data: approvalRequestData.attachments.map((att) => ({
          requestId: approvalRequest.id,
          attachmentType: att.attachmentType,
          fileName: att.fileName,
          filePath: att.filePath,
          fileSize: BigInt(att.fileSize || 0),
          mimeType: att.mimeType || null,
          uploaderId: input.updaterId,
        })),
      });
    }

    return serialize(submission);
  });
}

/**
 * 根据 ID 获取表单提交记录
 * @param submissionId 提交记录ID
 * @returns 提交记录，如果不存在则返回 null
 */
export async function getFormSubmissionById(submissionId: string) {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
    include: {
      template: {
        select: {
          id: true,
          key: true,
          name: true,
          schema: true,
        },
      },
      submitter: {
        select: {
          id: true,
          realName: true,
          username: true,
        },
      },
    },
  });

  if (!submission) {
    return null;
  }

  return serialize(submission);
}

/**
 * 获取表单提交记录列表
 * @param params 查询参数
 * @returns 提交记录列表
 */
export async function getFormSubmissionList(params?: {
  templateId?: string;
  submittedBy?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  page?: number;
  pageSize?: number;
}) {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (params?.templateId) {
    where.templateId = params.templateId;
  }
  if (params?.submittedBy !== undefined) {
    where.submittedBy = params.submittedBy;
  }
  if (params?.status) {
    where.status = params.status;
  }

  const [submissions, total] = await Promise.all([
    prisma.formSubmission.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        template: {
          select: {
            id: true,
            key: true,
            name: true,
          },
        },
        submitter: {
          select: {
            id: true,
            realName: true,
            username: true,
          },
        },
      },
    }),
    prisma.formSubmission.count({ where }),
  ]);

  return {
    data: submissions.map(serialize),
    total,
    page,
    pageSize,
  };
}

/**
 * 更新表单提交状态（审批）
 * @param submissionId 提交记录ID
 * @param status 新状态
 * @returns 更新后的提交记录
 */
export async function updateFormSubmissionStatus(
  submissionId: string,
  status: "PENDING" | "APPROVED" | "REJECTED"
) {
  const submission = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new ValidationError(`表单提交记录 ${submissionId} 不存在`, "submissionId", "SUBMISSION_NOT_FOUND");
  }

  const updated = await prisma.formSubmission.update({
    where: { id: submissionId },
    data: { status },
    include: {
      template: {
        select: {
          id: true,
          key: true,
          name: true,
        },
      },
      submitter: {
        select: {
          id: true,
          realName: true,
          username: true,
        },
      },
    },
  });

  return serialize(updated);
}
