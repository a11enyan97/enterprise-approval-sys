"use client";

import { Button, Table, Spin } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import ConfirmModal from "@/components/business/approval/ApprovalTableClient/ConfirmModal";
import type { ApprovalRequestListResponse, ApprovalRequestItem } from "@/types/approval";
import { type UserInfo } from "@/store/useUserStore";
import { getApprovalTableColumns } from "@/components/business/approval/ApprovalTableClient/TableColumn";
import { getModalConfigMap } from "@/constants/modalConfig";
import { useApprovalTableLogic } from "@/hooks/business/approval/useApprovalTableLogic";

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
  // 1. 所有的业务逻辑、状态、操作都委托给 Hook
  const { state, methods, handlers } = useApprovalTableLogic({ initialUser });
  const { isPending, approvalStatus, activeModal, currentUser } = state;
  const { isApplicant, isApprover } = methods;

  // 2. 根据逻辑层提供的 handlers 生成 UI 配置
  const columns = getApprovalTableColumns({
    user: currentUser,
    isApplicant,
    isApprover,
    approvalStatus,
    onView: handlers.handleView,
    onEdit: handlers.handleEdit,
    onSubmit: handlers.handleSubmit,
    onDelete: handlers.handleDelete,
    onApprove: handlers.handleApprove,
    onReject: handlers.handleReject,
  });

  const modalConfigMap = getModalConfigMap({
    approvalStatus,
    handleConfirmSubmit: handlers.handleConfirmSubmit,
    handleConfirmDelete: handlers.handleConfirmDelete,
    handleConfirmApproval: handlers.handleConfirmApproval,
  });

  // 3. 计算当前弹窗配置
  const currentModalConfig =
    activeModal.type && activeModal.record ? modalConfigMap[activeModal.type](activeModal.record) : null;

  // 4. 纯粹的视图渲染
  return (
    <>
      <div className="text-lg font-medium mb-4">
        {isApplicant() && (
          <Button type='primary' icon={<IconPlus />} style={{ width: '100px' }} onClick={handlers.handleCreate}>
            新建
          </Button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <Spin loading={isPending} style={{ width: '100%' }}>
          <Table<ApprovalRequestItem>
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
              onChange: handlers.handlePageChange,
              onPageSizeChange: handlers.handlePageChange,
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
          onCancel={handlers.handleCancelModal}
        />
      )}
    </>
  );
}
