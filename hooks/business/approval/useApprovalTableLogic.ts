import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Message } from "@arco-design/web-react";
import { useUserStore, type UserInfo, type UserStore } from "@/store/useUserStore";
import { submitApprovalAction, approveOrRejectAction, deleteApprovalAction } from "@/actions/approval.action";
import { removeIdFromStatus, addIdToStatus } from "@/utils/approvalUtils";
import { ACTION_TYPES, type ModalType } from "@/constants/modalConfig";
import type { ApprovalRequestItem } from "@/types/approval";

interface UseApprovalTableLogicProps {
  initialUser?: UserInfo;
}

export function useApprovalTableLogic({ initialUser }: UseApprovalTableLogicProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // --- 状态管理 ---
  const [approvalStatus, setApprovalStatus] = useState<{
    submittingIds: Set<string>;
    approvingIds: Set<string>;
    deletingIds: Set<string>;
  }>({
    submittingIds: new Set(),
    approvingIds: new Set(),
    deletingIds: new Set(),
  });

  const [activeModal, setActiveModal] = useState<{
    type: ModalType;
    record: ApprovalRequestItem | null;
  }>({
    type: null,
    record: null,
  });

  // --- 用户权限逻辑 ---
  const storeUser = useUserStore((state: UserStore) => state.user);
  const currentUser = storeUser || initialUser || null;
  const isApplicant = useCallback(() => currentUser?.role === "applicant", [currentUser]);
  const isApprover = useCallback(() => currentUser?.role === "approver", [currentUser]);

  // --- 核心辅助函数 ---
  const refreshData = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // 初始化刷新（保持原逻辑）
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 通用 Action 处理
  const handleAction = async (
    recordId: string,
    statusKey: keyof typeof approvalStatus,
    actionFn: () => Promise<{ success: boolean; error?: string }>,
    successMsg: string,
    errorMsg: string
  ) => {
    try {
      setApprovalStatus((prev) => addIdToStatus(prev, statusKey, recordId));
      const result = await actionFn();

      if (!result.success) {
        throw new Error(result.error || errorMsg);
      }

      Message.success(successMsg);
      setActiveModal({ type: null, record: null });
      refreshData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : errorMsg;
      Message.error(errorMessage);
    } finally {
      setApprovalStatus((prev) => removeIdFromStatus(prev, statusKey, recordId));
    }
  };

  // --- 业务交互处理 ---
  
  // 1. 页面跳转类
  const handlePageChange = (currentPage: number, currentPageSize?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(currentPage));
    if (currentPageSize) {
      params.set("pageSize", String(currentPageSize));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreate = () => router.push('/approval/info/add');
  
  const handleView = (record: ApprovalRequestItem) => {
    router.push(`/approval/info/details?submissionId=${record.submissionId}&requestId=${record.id}`);
  };

  const handleEdit = (record: ApprovalRequestItem) => {
    router.push(`/approval/info/edit?submissionId=${record.submissionId}&requestId=${record.id}`);
  };

  // 2. 弹窗触发类
  const handleSubmit = (record: ApprovalRequestItem) => {
    if (approvalStatus.submittingIds.has(record.id)) return;
    setActiveModal({ type: ACTION_TYPES.SUBMIT, record });
  };

  const handleApprove = (record: ApprovalRequestItem) => {
    if (!currentUser) return Message.error("请先登录");
    setActiveModal({ type: ACTION_TYPES.APPROVE, record });
  };

  const handleReject = (record: ApprovalRequestItem) => {
    if (!currentUser) return Message.error("请先登录");
    setActiveModal({ type: ACTION_TYPES.REJECT, record });
  };

  const handleDelete = (record: ApprovalRequestItem) => {
    if (!currentUser) return Message.error("请先登录");
    setActiveModal({ type: ACTION_TYPES.DELETE, record });
  };

  const handleCancelModal = () => {
    setActiveModal({ type: null, record: null });
  };

  // 3. 确认执行类
  const handleConfirmSubmit = async () => {
    if (activeModal.type !== ACTION_TYPES.SUBMIT || !activeModal.record) return;
    const recordId = activeModal.record.id;
    await handleAction(
      recordId,
      "submittingIds",
      () => submitApprovalAction(recordId),
      "提交成功",
      "提交失败"
    );
  };

  const handleConfirmApproval = async () => {
    if (
      !currentUser ||
      !activeModal.record ||
      (activeModal.type !== ACTION_TYPES.APPROVE && activeModal.type !== ACTION_TYPES.REJECT)
    ) return;

    const approvalAction = activeModal.type;
    const recordId = activeModal.record.id;
    const actionText = approvalAction === "approve" ? "审批通过" : "审批拒绝";

    await handleAction(
      recordId,
      "approvingIds",
      () => approveOrRejectAction(recordId, approvalAction, currentUser.id),
      actionText,
      "审批操作失败"
    );
  };

  const handleConfirmDelete = async () => {
    if (activeModal.type !== ACTION_TYPES.DELETE || !activeModal.record) return;
    const recordId = activeModal.record.id;
    await handleAction(
      recordId,
      "deletingIds",
      () => deleteApprovalAction(recordId),
      "删除成功",
      "删除失败"
    );
  };

  return {
    state: {
      isPending,
      approvalStatus,
      activeModal,
      currentUser,
    },
    methods: {
      isApplicant,
      isApprover,
    },
    handlers: {
      handlePageChange,
      handleCreate,
      handleView,
      handleEdit,
      handleSubmit,
      handleApprove,
      handleReject,
      handleDelete,
      handleCancelModal,
      handleConfirmSubmit,
      handleConfirmApproval,
      handleConfirmDelete,
    },
  };
}

