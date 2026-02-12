"use client";

/**
 * 审批列表表格 — UI 层
 *
 * 逻辑层已提取到 useApprovalTable hook，
 * 此组件只负责 Table、弹窗、按钮的渲染。
 */

import { Button, Table, Spin } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import ConfirmModal from "@/components/business/approval/ApprovalTableClient/ConfirmModal";
import type { UserInfo } from "@/store/useUserStore";
import type { ApprovalRequestListResponse } from "@/types/approval";
import { useApprovalTable } from "@/hooks/approval";

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
  user,
}: ApprovalTableClientProps) {
  const {
    isPending,
    isApplicant,
    activeModal,
    currentModalConfig,
    columns,
    handleCreate,
    handlePageChange,
    handleCancelModal,
  } = useApprovalTable({ initialData, initialPage, initialPageSize, user });

  return (
    <>
      <div className="text-lg font-medium mb-4">
        {isApplicant() && (
          <Button
            type="primary"
            icon={<IconPlus />}
            style={{ width: "100px" }}
            onClick={handleCreate}
          >
            新建
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <Spin loading={isPending} style={{ width: "100%" }}>
          <Table
            columns={columns}
            data={initialData.data || []}
            rowKey="id"
            stripe
            style={{ width: "100%" }}
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
