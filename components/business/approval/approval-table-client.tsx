"use client";

import { Button, Table, Message, Spin } from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import { IconPlus } from "@arco-design/web-react/icon";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation";
import ConfirmModal from "@/components/business/ConfirmModal";
import { submitApprovalAction, approveOrRejectAction, deleteApprovalAction } from "@/actions/approval.action";
import { useUserStore } from "@/store/userStore";
import type { ApprovalRequestItem, ApprovalRequestListResponse } from "@/types/approval";
import { getApprovalTableColumns } from "@/components/business/approvalConfig";

interface ApprovalTableClientProps {
  initialData: ApprovalRequestListResponse;
  initialPage: number;
  initialPageSize: number;
}

export default function ApprovalTableClient({
  initialData,
  initialPage,
  initialPageSize,
}: ApprovalTableClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // 提交加载状态
  const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
  
  // 审批加载状态
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  
  // 删除加载状态
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  // 确认弹窗状态
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<ApprovalRequestItem | null>(null);
  
  // 审批弹窗状态
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalRecord, setApprovalRecord] = useState<ApprovalRequestItem | null>(null);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
  
  // 删除弹窗状态
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<ApprovalRequestItem | null>(null);

  // 从全局状态获取用户信息
  const { user, isApplicant, isApprover } = useUserStore();

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
    router.push(`/approval/info/details?id=${record.id}`);
  };
  
  // 修改审批
  const handleEdit = (record: ApprovalRequestItem) => {
    router.push(`/approval/info/edit?id=${record.id}`);
  };
  
  // 提交审批 - 显示确认弹窗
  const handleSubmit = (record: ApprovalRequestItem) => {
    if (submittingIds.has(record.id)) {
      return;
    }
    setPendingRecord(record);
    setConfirmVisible(true);
  };

  // 删除审批 - 显示确认弹窗
  const handleDelete = (record: ApprovalRequestItem) => {
    if (!user) {
      Message.error("请先登录");
      return;
    }
    setDeleteRecord(record);
    setDeleteConfirmVisible(true);
  };
  
  // 确认提交
  const handleConfirmSubmit = async () => {
    if (!pendingRecord) return;
    
    try {
      setSubmittingIds((prev) => new Set(prev).add(pendingRecord.id));
      const result = await submitApprovalAction(pendingRecord.id, {
        currentStatus: "pending",
      });
      
      if (!result.success) {
        throw new Error("error" in result ? result.error : "提交失败");
      }
      
      Message.success("提交成功");
      setConfirmVisible(false);
      setPendingRecord(null);
      refreshData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "提交失败";
      Message.error(errorMessage);
    } finally {
      setSubmittingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(pendingRecord.id);
        return newSet;
      });
    }
  };
  
  // 取消提交
  const handleCancelSubmit = () => {
    setConfirmVisible(false);
    setPendingRecord(null);
  };
  
  // 审批处理（同意）
  const handleApprove = (record: ApprovalRequestItem) => {
    if (!user) {
      Message.error("请先登录");
      return;
    }
    setApprovalRecord(record);
    setApprovalAction("approve");
    setApprovalModalVisible(true);
  };
  
  // 审批处理（拒绝）
  const handleReject = (record: ApprovalRequestItem) => {
    if (!user) {
      Message.error("请先登录");
      return;
    }
    setApprovalRecord(record);
    setApprovalAction("reject");
    setApprovalModalVisible(true);
  };
  
  // 确认审批
  const handleConfirmApproval = async () => {
    if (!approvalRecord || !approvalAction || !user) {
      return;
    }
    
    try {
      setApprovingIds((prev) => new Set(prev).add(approvalRecord.id));
      const result = await approveOrRejectAction(
        approvalRecord.id,
        approvalAction,
        user.id
      );
      
      if (!result.success) {
        throw new Error("error" in result ? result.error : "审批操作失败");
      }
      
      Message.success(approvalAction === "approve" ? "审批通过" : "审批拒绝");
      setApprovalModalVisible(false);
      setApprovalRecord(null);
      setApprovalAction(null);
      refreshData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "审批操作失败";
      Message.error(errorMessage);
    } finally {
      setApprovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(approvalRecord.id);
        return newSet;
      });
    }
  };
  
  // 取消审批
  const handleCancelApproval = () => {
    setApprovalModalVisible(false);
    setApprovalRecord(null);
    setApprovalAction(null);
  };
  
  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteRecord) return;
    const recordId = deleteRecord.id;
    
    try {
      setDeletingIds((prev) => new Set(prev).add(recordId));
      const result = await deleteApprovalAction(recordId);
      
      if (!result.success) {
        throw new Error("error" in result ? result.error : "删除失败");
      }
      
      Message.success("删除成功");
      setDeleteConfirmVisible(false);
      setDeleteRecord(null);
      refreshData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "删除失败";
      Message.error(errorMessage);
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(recordId);
        return newSet;
      });
    }
  };
  
  // 取消删除
  const handleCancelDelete = () => {
    setDeleteConfirmVisible(false);
    setDeleteRecord(null);
  };

  // 表格列配置
  const columns = getApprovalTableColumns({
    user,
    isApplicant,
    isApprover,
    submittingIds,
    approvingIds,
    deletingIds,
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
      
      {/* 确认提交弹窗 */}
      <ConfirmModal
        type="submit"
        title="确认提交"
        visible={confirmVisible}
        projectName={pendingRecord?.projectName || ""}
        okText="确认提交"
        cancelText="取消"
        okButtonStatus="default"
        confirmLoading={pendingRecord ? submittingIds.has(pendingRecord.id) : false}
        onOk={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
      />
      
      {/* 删除确认弹窗 */}
      <ConfirmModal
        type="delete"
        title="确认删除"
        visible={deleteConfirmVisible}
        projectName={deleteRecord?.projectName || ""}
        okText="确认删除"
        cancelText="取消"
        okButtonStatus="danger"
        confirmLoading={deleteRecord ? deletingIds.has(deleteRecord.id) : false}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      
      {/* 审批确认弹窗 */}
      <ConfirmModal
        type="approve"
        title={approvalAction === "approve" ? "确认同意" : "确认拒绝"}
        visible={approvalModalVisible}
        projectName={approvalRecord?.projectName || ""}
        okText={approvalAction === "approve" ? "确认同意" : "确认拒绝"}
        cancelText="取消"
        okButtonStatus={approvalAction === "approve" ? "success" : "danger"}
        confirmLoading={approvalRecord ? approvingIds.has(approvalRecord.id) : false}
        approvalAction={approvalAction || undefined}
        onOk={handleConfirmApproval}
        onCancel={handleCancelApproval}
      />
    </>
  );
}

