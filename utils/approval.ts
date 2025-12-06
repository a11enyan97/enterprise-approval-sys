/**
 * 审批相关工具函数
 */

import type { ApprovalStatus } from "@/types/approval";
import { APPROVAL_STATUS_MAP } from "@/constants/approval";

/**
 * 获取审批状态的中文标签
 * @param status 审批状态
 * @returns 状态的中文标签
 */
export function getStatusLabel(status: ApprovalStatus | string): string {
  return APPROVAL_STATUS_MAP[status] || status;
}


/**
 * 审批状态管理工具函数
 */

type ApprovalStatusIds = {
  submittingIds: Set<string>;
  approvingIds: Set<string>;
  deletingIds: Set<string>;
};

/**
 * 从指定的 Set 中删除 ID
 * @param prev 当前状态
 * @param key 要更新的 Set 键名
 * @param id 要删除的 ID
 * @returns 更新后的状态
 */
export function removeIdFromStatus(
  prev: ApprovalStatusIds,
  key: keyof ApprovalStatusIds,
  id: string
): ApprovalStatusIds {
  const newSet = new Set(prev[key]);
  newSet.delete(id);
  return { ...prev, [key]: newSet };
}

/**
 * 向指定的 Set 中添加 ID
 * @param prev 当前状态
 * @param key 要更新的 Set 键名
 * @param id 要添加的 ID
 * @returns 更新后的状态
 */
export function addIdToStatus(
  prev: ApprovalStatusIds,
  key: keyof ApprovalStatusIds,
  id: string
): ApprovalStatusIds {
  return { ...prev, [key]: new Set(prev[key]).add(id) };
}
