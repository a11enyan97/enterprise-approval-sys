/**
 * 审批表格列配置
 */

import { Button } from "@arco-design/web-react";
import type { TableColumnProps } from "@arco-design/web-react";
import type { ApprovalRequestItem, ApprovalStatus } from "@/types/approval";
import { formatDateTime } from "@/utils/formatUtils";
import { getStatusLabel } from "@/utils/approvalUtils";

/**
 * 审批表格列配置参数
 */
export interface ApprovalTableColumnsOptions {
  user: { id: number } | null;
  isApplicant: () => boolean;
  isApprover: () => boolean;
  approvalStatus: {
    submittingIds: Set<string>;
    approvingIds: Set<string>;
    deletingIds: Set<string>;
  };
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
    approvalStatus,
    onView,
    onEdit,
    onSubmit,
    onDelete,
    onApprove,
    onReject,
  } = options;

  return [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      align: 'center',
      ellipsis: true,
    },
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
                  loading={approvalStatus.submittingIds.has(record.id)}
                >
                  提交
                </Button>
                <Button 
                  type="text" 
                  size="small" 
                  status="danger"
                  onClick={() => onDelete(record)}
                  loading={approvalStatus.deletingIds.has(record.id)}
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
                  loading={approvalStatus.approvingIds.has(record.id)}
                >
                  同意
                </Button>
                <Button 
                  type="text" 
                  size="small" 
                  status="danger"
                  onClick={() => onReject(record)}
                  loading={approvalStatus.approvingIds.has(record.id)}
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

