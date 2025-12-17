/**
 * 格式化工具函数
 */

import dayjs from "dayjs";
import type { ApprovalAttachmentItem, AttachmentInput } from "@/types/approval";

/**
 * 格式化日期时间
 * @param dateStr 日期字符串
 * @returns 格式化后的日期时间字符串，如果为空则返回 "--"
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "--";
  return dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss");
}

/**
 * 将附件数组转换为表单需要的格式
 * @param attachments 附件数组
 * @param attachmentType 附件类型
 * @returns 格式化后的附件数组，包含 uid, url, name, status 字段
 */
export function formatAttachmentsForForm(
  attachments: ApprovalAttachmentItem[] | undefined,
  attachmentType: "image" | "table"
): Array<{ uid: string; url: string; name: string; status: 'done' }> {
  return attachments
    ?.filter(att => att.attachmentType === attachmentType)
    .map(att => ({
      uid: att.id,
      url: att.filePath,
      name: att.fileName,
      status: 'done' as const,
    })) || [];
}

/**
 * 将已存在的附件转换为 AttachmentInput
 * @param fileList 文件列表
 * @param attachmentType 附件类型
 * @param approvalDetail 审批详情，用于查找原始附件信息
 * @returns AttachmentInput 数组
 */
export function convertExistingAttachmentsToInput(
  fileList: any[],
  attachmentType: 'image' | 'table',
  approvalDetail: { attachments?: ApprovalAttachmentItem[] } | null | undefined
): AttachmentInput[] {
  return fileList
    .filter((file: any) => file.url && !file.originFile)
    .map((file: any) => {
      // 从 approvalDetail 中查找对应的附件信息
      const originalAtt = approvalDetail?.attachments?.find(
        (att) => att.attachmentType === attachmentType && att.filePath === file.url
      );
      return {
        filePath: file.url,
        fileName: file.name,
        attachmentType,
        fileSize: originalAtt?.fileSize ? parseInt(originalAtt.fileSize, 10) : 0,
        mimeType: originalAtt?.mimeType || null,
      };
    });
}

/**
 * Next.js Server Actions 不支持直接传输包含方法的复杂对象（如 Dayjs 对象），
 * 它只支持普通的 JSON 对象、原生 Date 对象等。
 * 因此需要递归清理表单数据：
 * 1. 移除所有层级中的 原始 File 对象
 * 2. 将 Dayjs 对象转换为原生 Date 对象（以便 Server Actions 序列化）
 * @param data 任意数据
 * @returns 清理后的数据
 */
export function cleanFormData(data: any): any {
  if (data === null || typeof data !== "object") {
    return data;
  }

  // 处理 Dayjs 对象 -> 转为原生 Date
  if (dayjs.isDayjs(data)) {
    return data.toDate();
  }

  // 如果是数组，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map((item) => cleanFormData(item));
  }

  // 如果是对象
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    // 明确移除 originFile 字段
    if (key === "originFile") {
      continue;
    }
    // 递归处理值
    cleaned[key] = cleanFormData(value);
  }
  return cleaned;
}
