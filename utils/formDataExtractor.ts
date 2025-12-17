import type { FormSchema, FormField } from "@/types/formBuilder";

/**
 * 从表单数据和 schema 中提取关键信息
 * 用于创建 ApprovalRequest 时填充项目名称、申请部门、执行日期等字段
 * 
 * @param formData 表单提交的 JSON 数据
 * @param schema 表单 schema（包含字段定义）
 * @returns 提取的关键信息
 */
export function extractApprovalInfo(
  formData: Record<string, any>,
  schema: FormSchema
): {
  projectName: string;
  approvalContent?: string;
  deptId?: number | string | null;
  executeDate?: Date | string;
} {
  const fields = schema.fields || [];
  
  // 默认值
  let projectName = "";
  let approvalContent: string | undefined;
  let deptId: number | string | null = null;
  let executeDate: Date | string | undefined;

  // 遍历 schema 字段，根据字段类型和 key 提取对应数据
  for (const field of fields) {
    const value = formData[field.key];
    if (value === undefined || value === null || value === "") continue;

    // 根据字段类型和常见命名规则提取信息
    // 项目名称：通常包含 "project"、"name"、"title" 等关键词
    if (
      !projectName &&
      (field.key.toLowerCase().includes("project") ||
        field.key.toLowerCase().includes("name") ||
        field.key.toLowerCase().includes("title") ||
        field.label.includes("项目") ||
        field.label.includes("名称"))
    ) {
      projectName = String(value);
    }

    // 审批内容：通常是 textarea 类型，包含 "content"、"description"、"remark" 等
    if (
      !approvalContent &&
      (field.type === "textarea" ||
        field.key.toLowerCase().includes("content") ||
        field.key.toLowerCase().includes("description") ||
        field.key.toLowerCase().includes("remark") ||
        field.label.includes("内容") ||
        field.label.includes("描述") ||
        field.label.includes("备注"))
    ) {
      approvalContent = String(value);
      // 限制长度 300 字
      if (approvalContent.length > 300) {
        approvalContent = approvalContent.substring(0, 300);
      }
    }

    // 部门：通常是 treeSelect 类型，包含 "dept"、"department"、"部门" 等
    if (
      !deptId &&
      (field.type === "treeSelect" ||
        field.key.toLowerCase().includes("dept") ||
        field.key.toLowerCase().includes("department") ||
        field.label.includes("部门"))
    ) {
      deptId = typeof value === "number" ? value : String(value);
    }

    // 执行日期：通常是 date 类型，包含 "date"、"time"、"日期"、"时间" 等
    if (
      !executeDate &&
      (field.type === "date" ||
        field.key.toLowerCase().includes("date") ||
        field.key.toLowerCase().includes("time") ||
        field.label.includes("日期") ||
        field.label.includes("时间"))
    ) {
      executeDate = value instanceof Date ? value : String(value);
    }
  }

  // 如果项目名称为空，使用 schema 的 title 作为默认值
  if (!projectName && schema.title) {
    projectName = schema.title;
  }

  return {
    projectName,
    approvalContent,
    deptId,
    executeDate,
  };
}

