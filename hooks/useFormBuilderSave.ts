import { useUserStore } from "@/store/useUserStore";
import { Form, Message } from "@arco-design/web-react";
import { useState } from "react";
import { showSuccessMessage } from "@/utils/approvalUtils";
import { getFormBuilderState, useFormBuilderStore } from "@/store/useFormBuilderStore";
import { createFormTemplateAction } from "@/actions/form.action";

/**
 * 表单设计器「保存模板」逻辑
 *
 * @returns contextHolder Message 挂载点（需放在组件树中）
 * @returns canSave 是否有字段可保存（用于禁用保存按钮）
 * @returns saveModalVisible 保存弹窗是否可见
 * @returns saving 是否正在保存
 * @returns saveForm 保存弹窗表单实例
 * @returns handleSave 点击保存按钮，打开弹窗并填充
 * @returns handleConfirmSave 弹窗内确认保存
 * @returns handleCancelSave 弹窗取消/关闭
 */
export default function useFormBuilderSave() {
  const user = useUserStore((state) => state.user);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveForm] = Form.useForm();
  const fieldsLength = useFormBuilderStore((state) => state.schema.fields.length);
  const [message, contextHolder] = Message.useMessage();

  const canSave = fieldsLength > 0;

  const handleSave = () => {
    if (!user) {
      Message.error("请先登录");
      return;
    }
    if (fieldsLength === 0) {
      Message.warning("请至少添加一个字段");
      return;
    }
    setSaveModalVisible(true);
    const schema = getFormBuilderState().schema;
    saveForm.setFieldsValue({
      key: schema.title ? `form_${schema.title.toLowerCase().replace(/\s+/g, "_")}` : "",
      name: schema.title || "未命名表单",
      description: schema.description || "",
    });
  };

  const handleConfirmSave = async () => {
    try {
      const values = await saveForm.validate();
      if (!values.key || !values.name) {
        Message.error("请填写表单 key 和名称");
        return;
      }
      setSaving(true);
      const schema = getFormBuilderState().schema;
      const result = await createFormTemplateAction({
        key: values.key,
        name: values.name,
        description: values.description,
        schema,
        createdBy: user?.id as number,
        isPublished: false,
      });

      if (!result.success) {
        throw new Error("error" in result ? result.error : "保存失败");
      }

      setSaveModalVisible(false);
      showSuccessMessage(message, "保存成功", () => {
        saveForm.resetFields();
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "保存失败";
      Message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSave = () => {
    setSaveModalVisible(false);
    saveForm.resetFields();
  };

  return {
    contextHolder,
    canSave,
    saveModalVisible,
    saving,
    saveForm,
    handleSave,
    handleConfirmSave,
    handleCancelSave,
  };
}
