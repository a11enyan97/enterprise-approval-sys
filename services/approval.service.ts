import { prisma } from "@/prisma/db";
import {
  validateUserExists,
  validateDepartments,
  ValidationError,
} from "./_shared/validators";
import { serialize } from "./_shared/utils";
import { getDepartmentPathInfo } from "./departments.service";
import type { CreateApprovalRequestInput, SubmitApprovalRequestInput, GetApprovalListParams } from "@/types/approval";

/**
 * 创建审批申请的业务逻辑
 * @param input 审批申请数据
 * @returns 创建的审批申请记录
 */
export async function createApprovalRequest(
  input: CreateApprovalRequestInput
) {
  // 1. 数据验证：检查外键关联的数据是否存在
  await validateUserExists(input.applicantId);

  // 2. 处理部门信息：如果提供了 deptId，则根据 deptId 构建完整路径
  let deptLevel1Id: number | null = input.deptLevel1Id ?? null;
  let deptLevel2Id: number | null = input.deptLevel2Id ?? null;
  let deptLevel3Id: number | null = input.deptLevel3Id ?? null;
  let deptFullPath: string | null = input.deptFullPath ?? null;

  if (input.deptId) {
    // 根据部门ID查找完整路径信息
    const deptPathInfo = await getDepartmentPathInfo(input.deptId);
    if (!deptPathInfo) {
      throw new ValidationError(
        `部门ID ${input.deptId} 不存在`,
        "deptId",
        "DEPARTMENT_NOT_FOUND"
      );
    }
    deptLevel1Id = deptPathInfo.deptLevel1Id;
    deptLevel2Id = deptPathInfo.deptLevel2Id;
    deptLevel3Id = deptPathInfo.deptLevel3Id;
    deptFullPath = deptPathInfo.deptFullPath;
  }

  // 验证部门信息
  await validateDepartments(deptLevel1Id, deptLevel2Id, deptLevel3Id);

  // 3. 生成审批单号（使用时间戳确保唯一性）
  const requestNo = `APP${Date.now()}`;

  // 4. 处理日期字段，确保转换为 Date 对象
  const executeDate =
    input.executeDate instanceof Date
      ? input.executeDate
      : new Date(input.executeDate);

  // 5. 创建审批申请
  const approval = await prisma.approvalRequest.create({
    data: {
      requestNo,
      projectName: input.projectName,
      approvalContent: input.approvalContent,
      deptFullPath,
      deptLevel1Id,
      deptLevel2Id,
      deptLevel3Id,
      executeDate,
      applicantId: input.applicantId,
    },
    // 返回关联数据，方便前端使用
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

  // 将 BigInt 字段转换为字符串，避免序列化错误
  return serialize(approval);
}

/**
 * 根据ID获取审批申请详情
 * @param requestId 审批申请ID
 * @returns 审批申请记录，如果不存在则返回 null
 */
export async function getApprovalRequestById(requestId: bigint) {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: requestId },
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

  // 将 BigInt 字段转换为字符串，避免序列化错误
  return approval ? serialize(approval) : null;
}

/**
 * 获取审批申请列表
 * @param options 查询选项
 * @returns 审批申请列表和总数
 */
export async function getApprovalRequestList(options?: GetApprovalListParams) {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 10;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (options?.applicantId) {
    where.applicantId = options.applicantId;
  }
  if (options?.status) {
    where.currentStatus = options.status;
  }
  
  // 项目名称模糊查询
  if (options?.projectName) {
    where.projectName = {
      contains: options.projectName,
    };
  }
  
  // 创建时间范围查询
  if (options?.createTimeStart || options?.createTimeEnd) {
    where.createdAt = {};
    if (options.createTimeStart) {
      where.createdAt.gte = new Date(options.createTimeStart);
    }
    if (options.createTimeEnd) {
      where.createdAt.lte = new Date(options.createTimeEnd);
    }
  }
  
  // 审批时间范围查询（completedAt 字段）
  if (options?.approvalTimeStart || options?.approvalTimeEnd) {
    where.completedAt = {};
    if (options.approvalTimeStart) {
      where.completedAt.gte = new Date(options.approvalTimeStart);
    }
    if (options.approvalTimeEnd) {
      where.completedAt.lte = new Date(options.approvalTimeEnd);
    }
  }
  
  // 部门筛选：优先使用 deptId，如果提供了 deptId，则根据该部门ID查询该部门及其所有子部门
  if (options?.deptId) {
    // 根据部门ID获取部门路径信息
    const deptPathInfo = await getDepartmentPathInfo(options.deptId);
    if (deptPathInfo) {
      // 根据部门层级确定查询条件
      // 如果是指定的部门是三级部门，只查询该三级部门
      // 如果是指定的部门是二级部门，查询该二级部门下的所有三级部门
      // 如果是指定的部门是一级部门，查询该一级部门下的所有二级和三级部门
      if (deptPathInfo.deptLevel3Id) {
        where.deptLevel3Id = deptPathInfo.deptLevel3Id;
      } else if (deptPathInfo.deptLevel2Id) {
        where.deptLevel2Id = deptPathInfo.deptLevel2Id;
      } else if (deptPathInfo.deptLevel1Id) {
        where.deptLevel1Id = deptPathInfo.deptLevel1Id;
      }
    }
  } else {
    // 向后兼容：如果没有提供 deptId，则使用旧的层级ID方式
    if (options?.deptLevel3Id) {
      where.deptLevel3Id = options.deptLevel3Id;
    } else if (options?.deptLevel2Id) {
      where.deptLevel2Id = options.deptLevel2Id;
    } else if (options?.deptLevel1Id) {
      where.deptLevel1Id = options.deptLevel1Id;
    }
  }

  const [data, total] = await Promise.all([
    prisma.approvalRequest.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        applicant: {
          select: {
            id: true,
            realName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.approvalRequest.count({ where }),
  ]);

  // 将 BigInt 字段转换为字符串，避免序列化错误
  return {
    data: serialize(data),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 申请人——提交审批申请
 * @param requestId 审批申请ID
 * @returns 更新后的审批申请记录
 * @throws ValidationError 如果申请不存在、不是 draft 状态
 */
export async function submitApprovalRequest(
  requestId: bigint | string | number,
  data?: SubmitApprovalRequestInput
) {
  // 1. 转换 requestId 为 BigInt
  const id =
    typeof requestId === "bigint" ? requestId : BigInt(requestId);

  // 2. 查找对应的审批申请记录
  const existingApproval = await prisma.approvalRequest.findUnique({
    where: { id },
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

  // 3. 验证记录是否存在
  if (!existingApproval) {
    throw new ValidationError(
      `审批申请ID ${id} 不存在`,
      "requestId",
      "APPROVAL_NOT_FOUND"
    );
  }

  const updateData: any = {};

  // 提交审批和更新审批：如果传入 currentStatus，只更新状态字段；否则更新其他字段
  if (data?.currentStatus !== undefined) {
    // 只更新状态字段
    updateData.currentStatus = data.currentStatus;
    
    // 如果状态改为 pending，设置提交时间
    if (data.currentStatus === "pending") {
      // 验证原状态必须是 draft
      if (existingApproval.currentStatus !== "draft") {
        throw new ValidationError(
          `审批申请状态为 ${existingApproval.currentStatus}，只有 draft 状态的申请可以提交`,
          "currentStatus",
          "INVALID_STATUS"
        );
      }
      updateData.submittedAt = new Date();
    }
  } else if (data) {
    // 验证记录状态是否为 draft（只有 draft 状态可以修改）
    if (existingApproval.currentStatus !== "draft") {
      throw new ValidationError(
        `审批申请状态为 ${existingApproval.currentStatus}，只有 draft 状态的申请可以修改`,
        "currentStatus",
        "INVALID_STATUS"
      );
    }

    // 处理部门信息：如果提供了 deptId，则根据 deptId 构建完整路径
    if (data.deptId !== undefined) {
      const deptPathInfo = await getDepartmentPathInfo(data.deptId);
      if (!deptPathInfo) {
        throw new ValidationError(
          `部门ID ${data.deptId} 不存在`,
          "deptId",
          "DEPARTMENT_NOT_FOUND"
        );
      }
      updateData.deptLevel1Id = deptPathInfo.deptLevel1Id;
      updateData.deptLevel2Id = deptPathInfo.deptLevel2Id;
      updateData.deptLevel3Id = deptPathInfo.deptLevel3Id;
      updateData.deptFullPath = deptPathInfo.deptFullPath;
      
      // 验证部门信息
      await validateDepartments(
        updateData.deptLevel1Id,
        updateData.deptLevel2Id,
        updateData.deptLevel3Id
      );
    } else if (
      data.deptLevel1Id !== undefined ||
      data.deptLevel2Id !== undefined ||
      data.deptLevel3Id !== undefined
    ) {
      // 如果直接提供了层级ID，则使用提供的值
      await validateDepartments(
        data.deptLevel1Id,
        data.deptLevel2Id,
        data.deptLevel3Id
      );
      updateData.deptLevel1Id =
        data.deptLevel1Id !== undefined ? data.deptLevel1Id : null;
      updateData.deptLevel2Id =
        data.deptLevel2Id !== undefined ? data.deptLevel2Id : null;
      updateData.deptLevel3Id =
        data.deptLevel3Id !== undefined ? data.deptLevel3Id : null;
    }

    if (data.projectName !== undefined) {
      updateData.projectName = data.projectName;
    }
    if (data.approvalContent !== undefined) {
      updateData.approvalContent = data.approvalContent;
    }
    if (data.deptFullPath !== undefined && data.deptId === undefined) {
      // 只有在没有提供 deptId 时才使用直接提供的 deptFullPath
      updateData.deptFullPath = data.deptFullPath;
    }
    if (data.executeDate) {
      updateData.executeDate =
        data.executeDate instanceof Date
          ? data.executeDate
          : new Date(data.executeDate);
    }
  }

  // 5. 更新审批申请：根据传入字段更新数据
  const updatedApproval = await prisma.approvalRequest.update({
    where: { id },
    data: updateData,
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

  // 6. 将 BigInt 字段转换为字符串，避免序列化错误
  return serialize(updatedApproval);
}

/**
 * 审批申请（同意或拒绝）
 * @param requestId 审批申请ID
 * @param action 审批操作：'approve' 同意 或 'reject' 拒绝
 * @param approverId 审批人ID
 * @returns 更新后的审批申请记录
 * @throws ValidationError 如果申请不存在、不是 pending 状态
 */
export async function approveOrRejectRequest(
  requestId: bigint | string | number,
  action: "approve" | "reject",
  approverId: number
) {
  // 1. 转换 requestId 为 BigInt
  const id =
    typeof requestId === "bigint" ? requestId : BigInt(requestId);

  // 2. 查找对应的审批申请记录
  const existingApproval = await prisma.approvalRequest.findUnique({
    where: { id },
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

  // 3. 验证记录是否存在
  if (!existingApproval) {
    throw new ValidationError(
      `审批申请ID ${id} 不存在`,
      "requestId",
      "APPROVAL_NOT_FOUND"
    );
  }

  // 4. 验证记录状态是否为 pending
  if (existingApproval.currentStatus !== "pending") {
    throw new ValidationError(
      `审批申请状态为 ${existingApproval.currentStatus}，只有 pending 状态的申请可以审批`,
      "currentStatus",
      "INVALID_STATUS"
    );
  }

  // 5. 验证审批人是否存在
  await validateUserExists(approverId);

  // 6. 更新审批申请状态
  const newStatus = action === "approve" ? "approved" : "rejected";
  const updatedApproval = await prisma.approvalRequest.update({
    where: { id },
    data: {
      currentStatus: newStatus,
      completedAt: new Date(),
    },
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

  // 7. 将 BigInt 字段转换为字符串，避免序列化错误
  return serialize(updatedApproval);
}

/**
 * 删除审批申请
 * @param requestId 审批申请ID
 * @returns 删除的审批申请记录
 * @throws ValidationError 如果申请不存在
 */
export async function deleteApprovalRequest(requestId: bigint | string | number) {
  // 1. 转换 requestId 为 BigInt
  const id =
    typeof requestId === "bigint" ? requestId : BigInt(requestId);

  // 2. 查找对应的审批申请记录
  const existingApproval = await prisma.approvalRequest.findUnique({
    where: { id },
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

  // 3. 验证记录是否存在
  if (!existingApproval) {
    throw new ValidationError(
      `审批申请ID ${id} 不存在`,
      "requestId",
      "APPROVAL_NOT_FOUND"
    );
  }

  // 4. 删除附件和审批申请（使用事务保证一致性）
  await prisma.$transaction([
    prisma.approvalAttachment.deleteMany({
      where: { requestId: id },
    }),
    prisma.approvalRequest.delete({
      where: { id },
    }),
  ]);

  // 5. 返回被删除的审批申请（序列化处理 BigInt）
  return serialize(existingApproval);
}

