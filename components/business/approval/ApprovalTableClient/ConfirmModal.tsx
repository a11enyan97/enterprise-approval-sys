"use client";

import { Modal } from "@arco-design/web-react";

interface ConfirmModalProps {
    /** 是否显示弹窗 */
    visible: boolean;
    /** 弹窗标题 */
    title: string;
    /** 项目名称 */
    projectName: string;
    /** 确认按钮文本 */
    okText?: string;
    /** 取消按钮文本 */
    cancelText?: string;
    /** 确认按钮状态 */
    okButtonStatus?: "default" | "success" | "danger";
    /** 确认按钮加载状态 */
    confirmLoading?: boolean;
    /** 确认回调 */
    onOk: () => void;
    /** 取消回调 */
    onCancel: () => void;
    /** 自定义内容（如果不提供，将使用默认格式） */
    content?: React.ReactNode;
    /** 弹窗类型（submit/delete/approve） */
    type?: "submit" | "delete" | "approve";
    /** 审批操作类型（仅在 type 为 approve 时使用） */
    approvalAction?: "approve" | "reject";
}

/**
 * 确认弹窗组件
 * 用于提交、删除、审批等操作的确认
 */
export default function ConfirmModal({
    visible,
    title,
    projectName,
    okText = "确认",
    cancelText = "取消",
    okButtonStatus = "default",
    confirmLoading = false,
    onOk,
    onCancel,
    content,
    type,
    approvalAction,
}: ConfirmModalProps) {
    // 根据类型生成默认内容
    const getDefaultContent = () => {
        if (content) {
            return content;
        }

        switch (type) {
            case "submit":
                return (
                    <div>
                        确定要提交审批申请"<strong>{projectName}</strong>"吗？提交后将进入审批流程，无法再修改。
                    </div>
                );
            case "delete":
                return (
                    <div>
                        确定要删除审批申请"<strong>{projectName}</strong>"吗？删除后将无法恢复。
                    </div>
                );
            case "approve":
                const actionText = approvalAction === "approve" ? "同意" : approvalAction === "reject" ? "拒绝" : "处理";
                return (
                    <div>
                        确定要{actionText}审批申请"<strong>{projectName}</strong>"吗？
                    </div>
                );
            default:
                return (
                    <div>
                        确定要对审批申请"<strong>{projectName}</strong>"执行此操作吗？
                    </div>
                );
        }
    };

    return (
        <Modal
            title={title}
            visible={visible}
            onOk={onOk}
            onCancel={onCancel}
            okText={okText}
            cancelText={cancelText}
            okButtonProps={{
                status: okButtonStatus,
            }}
            confirmLoading={confirmLoading}
        >
            {getDefaultContent()}
        </Modal>
    );
}

