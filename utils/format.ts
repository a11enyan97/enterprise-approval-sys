/**
 * 格式化工具函数
 */

import dayjs from "dayjs";

/**
 * 格式化日期时间
 * @param dateStr 日期字符串
 * @returns 格式化后的日期时间字符串，如果为空则返回 "--"
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "--";
  return dayjs(dateStr).format("YYYY-MM-DD HH:mm:ss");
}

