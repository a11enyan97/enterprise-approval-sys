"use client";

/**
 * 审批列表表格逻辑 Hook
 *
 * 职责：
 * 1. 审批操作状态管理（submitting / approving / deleting）
 * 2. 弹窗状态管理（打开、关闭、当前配置）
 * 3. 各种操作 handler（提交、审批、删除、查看、编辑、新建）
 * 4. 分页与数据刷新
 * 5. 表格列配置生成
 */

import { useState, useTransition } from "react";
import { Message } from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { submitApprovalAction, approveOrRejectAction, deleteApprovalAction } from "@/actions/approval.action";
import { useUserStore, type UserStore, type UserInfo } from "@/store/useUserStore";
import type { ApprovalRequestItem, ApprovalRequestListResponse } from "@/types/approval";
import { getApprovalTableColumns } from "@/components/business/approval/ApprovalTableClient/TableColumn";
import { removeIdFromStatus, addIdToStatus } from "@/utils/approvalUtils";
import { ACTION_TYPES, getModalConfigMap, type ModalType } from "@/constants/modalConfig";

// ================================================================
// 类型定义
// ================================================================

interface UseApprovalTableParams {
  initialData: ApprovalRequestListResponse;
  initialPage: number;
  initialPageSize: number;
  user?: UserInfo;
}

interface ModalConfig {
  title: string;
  okText: string;
  cancelText: string;
  okButtonStatus: "default" | "success" | "danger";
  confirmLoading: boolean;
  approvalAction?: "approve" | "reject";
  type: "submit" | "delete" | "approve";
  onOk: () => void;
}

interface UseApprovalTableReturn {
  /** 路由切换中 */
  isPending: boolean;
  /** 当前用户 */
  currentUser: UserInfo | null;
  /** 是否申请人 */
  isApplicant: () => boolean;
  /** 是否审批人 */
  isApprover: () => boolean;
  /** 各操作的加载状态 */
  approvalStatus: {
    submittingIds: Set<string>;
    approvingIds: Set<string>;
    deletingIds: Set<string>;
  };
  /** 当前弹窗 */
  activeModal: {
    type: ModalType;
    record: ApprovalRequestItem | null;
  };
  /** 当前弹窗配置（null 表示无弹窗） */
  currentModalConfig: ModalConfig | null;
  /** 表格列配置 */
  columns: TableColumnProps<ApprovalRequestItem>[];
  /** 新建审批 */
  handleCreate: () => void;
  /** 分页变化 */
  handlePageChange: (currentPage: number, currentPageSize?: number) => void;
  /** 关闭弹窗 */
  handleCancelModal: () => void;
}

// ================================================================
// Hook 实现
// ================================================================

export default function useApprovalTable({
  user: initialUser
}: UseApprovalTableParams): UseApprovalTableReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ── 操作状态管理 ──
  const [approvalStatus, setApprovalStatus] = useState<{
    submittingIds: Set<string>;
    approvingIds: Set<string>;
    deletingIds: Set<string>;
  }>({
    submittingIds: new Set(),
    approvingIds: new Set(),
    deletingIds: new Set(),
  });

  // ── 弹窗状态 ──
  const [activeModal, setActiveModal] = useState<{
    type: ModalType;
    record: ApprovalRequestItem | null;
  }>({
    type: null,
    record: null,
  });

  // ── 用户 & 角色 ──
  const storeUser = useUserStore((state: UserStore) => state.user);
  const currentUser = storeUser || initialUser || null;
  const isApplicant = () => currentUser?.role === "applicant";
  const isApprover = () => currentUser?.role === "approver";

  // ── 分页 ──
  const handlePageChange = (currentPage: number, currentPageSize?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(currentPage));
    if (currentPageSize) {
      params.set("pageSize", String(currentPageSize));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // ── 刷新 ──
  const refreshData = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // ── 导航操作 ──
  const handleCreate = () => router.push("/approval/info/add");
  const handleView = (record: ApprovalRequestItem) =>
    router.push(`/approval/info/details?submissionId=${record.submissionId}&requestId=${record.id}`);
  const handleEdit = (record: ApprovalRequestItem) =>
    router.push(`/approval/info/edit?submissionId=${record.submissionId}&requestId=${record.id}`);

  // ── 提交审批 ──
  const handleSubmit = (record: ApprovalRequestItem) => {
    if (approvalStatus.submittingIds.has(record.id)) return;
    setActiveModal({ type: ACTION_TYPES.SUBMIT, record });
  };

  const handleConfirmSubmit = async () => {
    if (activeModal.type !== ACTION_TYPES.SUBMIT || !activeModal.record) return;
    const recordId = activeModal.record.id;

    try {
      setApprovalStatus((prev) => addIdToStatus(prev, "submittingIds", recordId));
      const result = await submitApprovalAction(recordId);

      if (!result.success) {
        throw new Error("error" in result ? result.error : "提交失败");
      }
      Message.success("提交成功");
      setActiveModal({ type: null, record: null });
      refreshData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "提交失败";
      Message.error(errorMessage);
    } finally {
      setApprovalStatus((prev) => removeIdFromStatus(prev, "submittingIds", recordId));
    }
  };

  // ── 审批（同意 / 拒绝） ──
  const handleApprove = (record: ApprovalRequestItem) => {
    if (!currentUser) {
      Message.error("请先登录");
      return;
    }
    setActiveModal({ type: ACTION_TYPES.APPROVE, record });
  };

  const handleReject = (record: ApprovalRequestItem) => {
    if (!currentUser) {
      Message.error("请先登录");
      return;
    }
    setActiveModal({ type: ACTION_TYPES.REJECT, record });
  };

  const handleConfirmApproval = async () => {
    if (
      !currentUser ||
      !activeModal.record ||
      (activeModal.type !== ACTION_TYPES.APPROVE && activeModal.type !== ACTION_TYPES.REJECT)
    ) {
      return;
    }
    const approvalAction = activeModal.type;
    const recordId = activeModal.record.id;

    try {
      setApprovalStatus((prev) => addIdToStatus(prev, "approvingIds", recordId));
      const result = await approveOrRejectAction(recordId, approvalAction, currentUser.id);

      if (!result.success) {
        throw new Error("error" in result ? result.error : "审批操作失败");
      }
      Message.success(approvalAction === "approve" ? "审批通过" : "审批拒绝");
      setActiveModal({ type: null, record: null });
      refreshData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "审批操作失败";
      Message.error(errorMessage);
    } finally {
      setApprovalStatus((prev) => removeIdFromStatus(prev, "approvingIds", recordId));
    }
  };

  // ── 删除 ──
  const handleDelete = (record: ApprovalRequestItem) => {
    if (!currentUser) {
      Message.error("请先登录");
      return;
    }
    setActiveModal({ type: ACTION_TYPES.DELETE, record });
  };

  const handleConfirmDelete = async () => {
    if (activeModal.type !== ACTION_TYPES.DELETE || !activeModal.record) return;
    const recordId = activeModal.record.id;

    try {
      setApprovalStatus((prev) => addIdToStatus(prev, "deletingIds", recordId));
      const result = await deleteApprovalAction(recordId);

      if (!result.success) {
        throw new Error("error" in result ? result.error : "删除失败");
      }
      Message.success("删除成功");
      setActiveModal({ type: null, record: null });
      refreshData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "删除失败";
      Message.error(errorMessage);
    } finally {
      setApprovalStatus((prev) => removeIdFromStatus(prev, "deletingIds", recordId));
    }
  };

  // ── 弹窗 ──
  const handleCancelModal = () => {
    setActiveModal({ type: null, record: null });
  };

  const modalConfigMap = getModalConfigMap({
    approvalStatus,
    handleConfirmSubmit,
    handleConfirmDelete,
    handleConfirmApproval,
  });

  const currentModalConfig =
    activeModal.type && activeModal.record ? modalConfigMap[activeModal.type](activeModal.record) : null;

  // ── 表格列配置 ──
  const columns = getApprovalTableColumns({
    user: currentUser,
    isApplicant,
    isApprover,
    approvalStatus,
    onView: handleView,
    onEdit: handleEdit,
    onSubmit: handleSubmit,
    onDelete: handleDelete,
    onApprove: handleApprove,
    onReject: handleReject,
  });

  return {
    isPending,
    currentUser,
    isApplicant,
    isApprover,
    approvalStatus,
    activeModal,
    currentModalConfig,
    columns,
    handleCreate,
    handlePageChange,
    handleCancelModal,
  };
}
