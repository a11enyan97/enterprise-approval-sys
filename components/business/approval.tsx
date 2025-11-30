/**
 * 审批相关工具函数
 */

import { Button } from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import type { ApprovalRequestItem, ApprovalStatus } from "@/types/approval";
import { formatDateTime } from "@/utils/format";

/**
 * 审批状态映射
 * @param status 审批状态
 * @returns 状态的中文标签
 */
export function getStatusLabel(status: ApprovalStatus | string): string {
  const statusMap: Record<string, string> = {
    draft: "草稿",
    pending: "待审批",
    approved: "已通过",
    rejected: "已拒绝",
  };
  return statusMap[status] || status;
}

/**
 * 审批表格列配置参数
 */
export interface ApprovalTableColumnsOptions {
  user: { id: number } | null;
  isApplicant: () => boolean;
  isApprover: () => boolean;
  submittingIds: Set<string>;
  approvingIds: Set<string>;
  deletingIds: Set<string>;
  onView: (record: ApprovalRequestItem) => void;
  onEdit: (record: ApprovalRequestItem) => void;
  onSubmit: (record: ApprovalRequestItem) => void;
  onDelete: (record: ApprovalRequestItem) => void;
  onApprove: (record: ApprovalRequestItem) => void;
  onReject: (record: ApprovalRequestItem) => void;
}

/**
 * 获取审批表格列配置
 * @param options 列配置选项
 * @returns 表格列配置数组
 */
export function getApprovalTableColumns(
  options: ApprovalTableColumnsOptions
): TableColumnProps<ApprovalRequestItem>[] {
  const {
    user,
    isApplicant,
    isApprover,
    submittingIds,
    approvingIds,
    deletingIds,
    onView,
    onEdit,
    onSubmit,
    onDelete,
    onApprove,
    onReject,
  } = options;

  return [
    {
      title: '审核状态',
      dataIndex: 'currentStatus',
      align: 'center',
      render: (status: ApprovalStatus) => getStatusLabel(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      align: 'center',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      align: 'center',
      render: (date: string | null) => formatDateTime(date),
    },
    {
      title: '审批时间',
      dataIndex: 'completedAt',
      align: 'center',
      render: (date: string | null) => formatDateTime(date),
    },
    {
      title: '审批项目',
      dataIndex: 'projectName',
      align: 'center',
      ellipsis: true,
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      align: 'center',
      render: (applicant: { realName: string }) => applicant?.realName || "--",
    },
    {
      title: '操作',
      dataIndex: 'action',
      align: 'center',
      render: (text: string, record: ApprovalRequestItem) => {
        const isDraft = record.currentStatus === "draft";
        const isPending = record.currentStatus === "pending";
        const isOwnRecord = user && record.applicantId === user.id;
        
        return (
          <div className="flex items-center justify-center gap-2">
            <Button type="text" size="small" onClick={() => onView(record)}>查看</Button>
            
            {/* 申请者权限：只能操作自己创建的草稿状态申请 */}
            {isApplicant() && isDraft && isOwnRecord && (
              <>
                <Button type="text" size="small" onClick={() => onEdit(record)}>修改</Button>
                <Button 
                  type="text" 
                  size="small" 
                  onClick={() => onSubmit(record)}
                  loading={submittingIds.has(record.id)}
                >
                  提交
                </Button>
                <Button 
                  type="text" 
                  size="small" 
                  status="danger"
                  onClick={() => onDelete(record)}
                  loading={deletingIds.has(record.id)}
                >
                  删除
                </Button>
              </>
            )}
            
            {/* 审批者权限：只能审批 pending 状态的申请 */}
            {isApprover() && isPending && (
              <>
                <Button 
                  type="text" 
                  size="small" 
                  status="success"
                  onClick={() => onApprove(record)}
                  loading={approvingIds.has(record.id)}
                >
                  同意
                </Button>
                <Button 
                  type="text" 
                  size="small" 
                  status="danger"
                  onClick={() => onReject(record)}
                  loading={approvingIds.has(record.id)}
                >
                  拒绝
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];
}

