"use client";

import { Button, Table, Message, Spin } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import ConfirmModal from "@/components/business/approval/ApprovalTableClient/ConfirmModal";
import { submitApprovalAction, approveOrRejectAction, deleteApprovalAction } from "@/actions/approval.action";
import { useUserStore, type UserStore, type UserInfo } from "@/store/useUserStore";
import type { ApprovalRequestItem, ApprovalRequestListResponse } from "@/types/approval";
import { getApprovalTableColumns } from "@/components/business/approval/ApprovalTableClient/TableColumn";
import { removeIdFromStatus, addIdToStatus } from "@/utils/approvalUtils";
import { ACTION_TYPES, getModalConfigMap, type ModalType } from "@/constants/modalConfig";

interface ApprovalTableClientProps {
  initialData: ApprovalRequestListResponse;
  initialPage: number;
  initialPageSize: number;
  user?: UserInfo;
}

export default function ApprovalTableClient({
  initialData,
  initialPage,
  initialPageSize,
  user: initialUser,
}: ApprovalTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // 审批状态管理：用于管理正在执行的操作的审批请求ID集合，用于防止重复操作并显示加载状态
  const [approvalStatus, setApprovalStatus] = useState<{
    submittingIds: Set<string>; // 正在执行提交操作的审批请求ID集合（将状态从 draft 草稿 提交为 pending 待审批）
    approvingIds: Set<string>; // 正在执行审批操作的审批请求ID集合（将状态从 pending 待审批 变为 approved 已通过 或 rejected 已拒绝）
    deletingIds: Set<string>; // 正在执行删除操作的审批请求ID集合，用于防止重复删除并显示加载状态
  }>({
    submittingIds: new Set(), 
    approvingIds: new Set(), 
    deletingIds: new Set(), 
  });

  // 弹窗状态管理：统一描述当前弹窗类型与目标数据
  const [activeModal, setActiveModal] = useState<{
    type: ModalType;
    record: ApprovalRequestItem | null;
  }>({
    type: null,
    record: null,
  });

  // 从全局状态获取用户信息（优先使用客户端 Store，服务端渲染使用 Props）
  const storeUser = useUserStore((state: UserStore) => state.user);
  const currentUser = storeUser || initialUser || null;
  
  // 本地实现角色判断逻辑，确保 SSR 一致性
  const isApplicant = () => currentUser?.role === "applicant";
  const isApprover = () => currentUser?.role === "approver";

  // 分页变化处理 - 使用 URL 搜索参数
  const handlePageChange = (currentPage: number, currentPageSize?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(currentPage));
    if (currentPageSize) {
      params.set("pageSize", String(currentPageSize));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // 刷新数据
  const refreshData = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // 新建审批
  const handleCreate = () => {
    router.push('/approval/info/add');
  };
  // 查看审批
  const handleView = (record: ApprovalRequestItem) => {
    router.push(`/approval/info/details?submissionId=${record.submissionId}&requestId=${record.id}`);
  };
  // 修改审批
  const handleEdit = (record: ApprovalRequestItem) => {
    router.push(`/approval/info/edit?submissionId=${record.submissionId}&requestId=${record.id}`);
  };

  // 提交审批 - 显示确认弹窗
  const handleSubmit = (record: ApprovalRequestItem) => {
    if (approvalStatus.submittingIds.has(record.id)) {
      return;
    }
    setActiveModal({ type: ACTION_TYPES.SUBMIT, record });
  };
  // 确认提交
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


  // 审批处理（同意）- 显示确认弹窗
  const handleApprove = (record: ApprovalRequestItem) => {
    if (!currentUser) {
      Message.error("请先登录");
      return;
    }
    setActiveModal({ type: ACTION_TYPES.APPROVE, record });
  };

  // 审批处理（拒绝）- 显示确认弹窗
  const handleReject = (record: ApprovalRequestItem) => {
    if (!currentUser) {
      Message.error("请先登录");
      return;
    }
    setActiveModal({ type: ACTION_TYPES.REJECT, record });
  };

  // 确认审批
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
      const result = await approveOrRejectAction(
        recordId,
        approvalAction,
        currentUser.id
      );

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

  // 删除审批 - 显示确认弹窗
  const handleDelete = (record: ApprovalRequestItem) => {
    if (!currentUser) {
      Message.error("请先登录");
      return;
    }
    setActiveModal({ type: ACTION_TYPES.DELETE, record });
  };
  // 确认删除
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

  // 关闭弹窗
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

  // 表格列配置
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

  return (
    <>
      <div className="text-lg font-medium mb-4">
        {/* 只有申请者才能新建 */}
        {isApplicant() && (
          <Button type='primary' icon={<IconPlus />} style={{ width: '100px' }} onClick={handleCreate}>
            新建
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <Spin loading={isPending} style={{ width: '100%' }}>
          <Table
            columns={columns}
            data={initialData.data || []}
            rowKey="id"
            stripe
            style={{ width: '100%' }}
            pagination={{
              current: initialPage,
              pageSize: initialPageSize,
              total: initialData.total || 0,
              showTotal: true,
              showJumper: true,
              onChange: handlePageChange,
              onPageSizeChange: handlePageChange,
            }}
            noDataElement="暂无数据"
          />
        </Spin>
      </div>

      {currentModalConfig && (
        <ConfirmModal
          type={currentModalConfig.type}
          title={currentModalConfig.title}
          visible={Boolean(activeModal.type)}
          projectName={activeModal.record?.projectName || ""}
          okText={currentModalConfig.okText}
          cancelText={currentModalConfig.cancelText}
          okButtonStatus={currentModalConfig.okButtonStatus}
          confirmLoading={currentModalConfig.confirmLoading}
          approvalAction={currentModalConfig.approvalAction}
          onOk={currentModalConfig.onOk}
          onCancel={handleCancelModal}
        />
      )}
    </>
  );
}

