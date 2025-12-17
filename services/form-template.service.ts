import { prisma } from "@/prisma/db";
import { ValidationError } from "./_shared/validators";
import { serialize } from "./_shared/utils";
import type { FormSchema } from "@/types/formBuilder";

/**
 * 创建表单模板
 * @param input 表单模板数据
 * @returns 创建的模板记录
 */
export async function createFormTemplate(input: {
  key: string;
  name: string;
  description?: string;
  schema: FormSchema;
  createdBy?: number;
  isPublished?: boolean;
}) {
  console.log('创建表单模板参数', input);

  // 1. 验证必填字段
  if (!input.key || !input.name) {
    throw new ValidationError("表单 key 和名称不能为空", "key/name", "MISSING_REQUIRED_FIELDS");
  }

  // 2. 检查 key 是否已存在
  const existing = await prisma.formTemplate.findUnique({
    where: { key: input.key },
  });

  if (existing) {
    throw new ValidationError(`表单 key "${input.key}" 已存在`, "key", "DUPLICATE_KEY");
  }

  // 3. 验证 schema 格式
  if (!input.schema || !Array.isArray(input.schema.fields)) {
    throw new ValidationError("表单 schema 格式不正确", "schema", "INVALID_SCHEMA");
  }

  // 4. 创建模板
  try {
    const template = await prisma.formTemplate.create({
      data: {
        key: input.key,
        name: input.name,
        description: input.description || null,
        schema: input.schema as any, // Prisma Json 类型
        isPublished: input.isPublished ?? false,
        createdBy: input.createdBy || null,
      },
      include: {
        creator: {
          select: {
            id: true,
            realName: true,
            username: true,
          },
        },
      },
    });
    console.log('创建表单模板成功', template);
    return serialize(template);
  } catch (error) {
    console.error('创建表单模板失败', error);
    throw new ValidationError("创建表单模板失败", "createFormTemplate", "CREATE_FORM_TEMPLATE_FAILED");
  }


}

/**
 * 更新表单模板
 * @param templateId 模板ID
 * @param input 更新数据
 * @returns 更新后的模板记录
 */
export async function updateFormTemplate(
  templateId: string,
  input: {
    name?: string;
    description?: string;
    schema?: FormSchema;
    isPublished?: boolean;
  }
) {
  // 1. 检查模板是否存在
  const existing = await prisma.formTemplate.findUnique({
    where: { id: templateId },
  });

  if (!existing) {
    throw new ValidationError(`表单模板 ${templateId} 不存在`, "templateId", "TEMPLATE_NOT_FOUND");
  }

  // 2. 更新模板
  const template = await prisma.formTemplate.update({
    where: { id: templateId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.schema !== undefined && { schema: input.schema as any }),
      ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
    },
    include: {
      creator: {
        select: {
          id: true,
          realName: true,
          username: true,
        },
      },
    },
  });

  return serialize(template);
}

/**
 * 根据 key 获取表单模板
 * @param key 表单 key
 * @returns 模板记录，如果不存在则返回 null
 */
export async function getFormTemplateByKey(key: string) {
  const template = await prisma.formTemplate.findUnique({
    where: { key },
    include: {
      creator: {
        select: {
          id: true,
          realName: true,
          username: true,
        },
      },
    },
  });

  if (!template) {
    return null;
  }

  return serialize(template);
}

/**
 * 根据 ID 获取表单模板
 * @param templateId 模板ID
 * @returns 模板记录，如果不存在则返回 null
 */
export async function getFormTemplateById(templateId: string) {
  const template = await prisma.formTemplate.findUnique({
    where: { id: templateId },
    include: {
      creator: {
        select: {
          id: true,
          realName: true,
          username: true,
        },
      },
    },
  });

  if (!template) {
    return null;
  }

  return serialize(template);
}

/**
 * 获取表单模板列表
 * @param params 查询参数
 * @returns 模板列表
 */
export async function getFormTemplateList(params?: {
  isPublished?: boolean;
  createdBy?: number;
  page?: number;
  pageSize?: number;
}) {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (params?.isPublished !== undefined) {
    where.isPublished = params.isPublished;
  }
  if (params?.createdBy !== undefined) {
    where.createdBy = params.createdBy;
  }

  const [templates, total] = await Promise.all([
    prisma.formTemplate.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: {
            id: true,
            realName: true,
            username: true,
          },
        },
      },
    }),
    prisma.formTemplate.count({ where }),
  ]);

  return {
    data: templates.map(serialize),
    total,
    page,
    pageSize,
  };
}

