import type { ApprovalRequestItem } from "@/types/approval";

/**
 * 弹窗类型
 * - 将同意和拒绝拆分为两个明确的操作
 */
export const ACTION_TYPES = {
  SUBMIT: "submit",
  DELETE: "delete",
  APPROVE: "approve",
  REJECT: "reject",
} as const;

export type ModalType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES] | null;

export type ApprovalStatusState = {
  submittingIds: Set<string>;
  approvingIds: Set<string>;
  deletingIds: Set<string>;
};

type ModalConfig = {
  title: string;
  okText: string;
  cancelText: string;
  okButtonStatus: "default" | "success" | "danger";
  confirmLoading: boolean;
  approvalAction?: typeof ACTION_TYPES.APPROVE | typeof ACTION_TYPES.REJECT;
  type: typeof ACTION_TYPES.SUBMIT | typeof ACTION_TYPES.DELETE | typeof ACTION_TYPES.APPROVE;
  onOk: () => void;
};

type ConfigDeps = {
  approvalStatus: ApprovalStatusState;
  handleConfirmSubmit: () => void;
  handleConfirmDelete: () => void;
  handleConfirmApproval: () => void;
};

// 生成弹窗配置映射，便于在组件内复用
export const getModalConfigMap = ({
  approvalStatus,
  handleConfirmSubmit,
  handleConfirmDelete,
  handleConfirmApproval,
}: ConfigDeps): Record<Exclude<ModalType, null>, (record: ApprovalRequestItem) => ModalConfig> => ({
  [ACTION_TYPES.SUBMIT]: (record) => ({
    title: "确认提交",
    okText: "确认提交",
    cancelText: "取消",
    okButtonStatus: "default",
    confirmLoading: approvalStatus.submittingIds.has(record.id),
    type: ACTION_TYPES.SUBMIT,
    onOk: handleConfirmSubmit,
  }),
  [ACTION_TYPES.DELETE]: (record) => ({
    title: "确认删除",
    okText: "确认删除",
    cancelText: "取消",
    okButtonStatus: "danger",
    confirmLoading: approvalStatus.deletingIds.has(record.id),
    type: ACTION_TYPES.DELETE,
    onOk: handleConfirmDelete,
  }),
  [ACTION_TYPES.APPROVE]: (record) => ({
    title: "确认同意",
    okText: "确认同意",
    cancelText: "取消",
    okButtonStatus: "success",
    confirmLoading: approvalStatus.approvingIds.has(record.id),
    approvalAction: ACTION_TYPES.APPROVE,
    type: ACTION_TYPES.APPROVE,
    onOk: handleConfirmApproval,
  }),
  [ACTION_TYPES.REJECT]: (record) => ({
    title: "确认拒绝",
    okText: "确认拒绝",
    cancelText: "取消",
    okButtonStatus: "danger",
    confirmLoading: approvalStatus.approvingIds.has(record.id),
    approvalAction: ACTION_TYPES.REJECT,
    type: ACTION_TYPES.APPROVE,
    onOk: handleConfirmApproval,
  }),
});

