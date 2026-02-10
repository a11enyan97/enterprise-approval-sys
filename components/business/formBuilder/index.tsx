"use client";

/**
 * 表单设计器布局与 DnD：按需订阅（仅 fieldsLength），
 * 画布/属性面板/Schema/表单信息各自订阅自己的 slice，避免整棵 schema 导致全量重渲染
 */

import { Button, Card, Form, Input, Space, Tag, Typography, Modal } from "@arco-design/web-react";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import { useFormBuilderStore, getFormBuilderState } from "@/store/useFormBuilderStore";
import PropertyPanel from "@/components/business/formBuilder/PropertyPanel";
import Canvas from "@/components/business/formBuilder/Canvas";
import FormMetaSection from "@/components/business/formBuilder/FormMetaSection";
import SchemaPreview from "@/components/business/formBuilder/SchemaPreview";
import PaletteItem, { paletteItems } from "@/components/business/formBuilder/PaletteItem";
import useFormBuilderDnd from "@/hooks/useFormBuilderDnd";
import useFormBuilderSave from "@/hooks/useFormBuilderSave";

// 从Typography 组件中导入 Title 和 Paragraph 组件
const { Title, Paragraph } = Typography;

export default function FormBuilderClient() {
  // 拖拽相关逻辑
  const {
    sensors,
    activeField,
    activeOverlayWidth,
    handleDragEnd,
    handleDragStart,
    handleDragCancel
  } = useFormBuilderDnd();

  // 保存相关逻辑
  const {
    contextHolder,
    canSave,
    saveModalVisible,
    saving,
    saveForm,
    handleSave,
    handleConfirmSave,
    handleCancelSave
  } = useFormBuilderSave();

  const reset = useFormBuilderStore((state) => state.reset);

  return (
    <div className="space-y-4">
      {contextHolder}
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Title heading={4} style={{ margin: 0 }}>
              拖拽式表单设计器
            </Title>
            <Paragraph style={{ margin: "4px 0 0" }} type="secondary">
              从左侧选择组件拖拽到画布，在右侧配置字段属性
            </Paragraph>
          </div>
          <Space>
            <Button onClick={() => reset()}>清空画布</Button>
            <Button onClick={() => navigator.clipboard?.writeText(JSON.stringify(getFormBuilderState().schema, null, 2))}>
              复制 JSON
            </Button>
            <Button type="primary" onClick={handleSave} disabled={!canSave}>
              保存模板
            </Button>
          </Space>
        </div>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
      >
        <div className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-3 space-y-3">
            <Card size="small" title="基础组件">
              <div className="space-y-3">
                {paletteItems.map((item) => (
                  <PaletteItem key={item.type} {...item} />
                ))}
              </div>
            </Card>
          </div>

          <div className="md:col-span-6 space-y-3">
            <Card size="small" title="画布">
              <Canvas />
            </Card>
          </div>

          <div className="md:col-span-3 space-y-3">
            <FormMetaSection />
            <PropertyPanel />
            <SchemaPreview />
          </div>
        </div>

        <DragOverlay dropAnimation={null} style={{ cursor: "grabbing" }}>
          {activeField ? (
            <div
              className="rounded-lg border border-blue-200 bg-white p-3 shadow"
              style={{ width: activeOverlayWidth ? `${activeOverlayWidth}px` : undefined, maxWidth: "100%" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">{activeField.label}</span>
                <Tag color="arcoblue" size="small">
                  {activeField.type}
                </Tag>
              </div>
              <div className="mt-1 text-xs text-gray-500">{activeField.placeholder || "未设置占位"}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* 保存模板弹窗 */}
      <Modal
        title="保存表单模板"
        visible={saveModalVisible}
        onOk={handleConfirmSave}
        onCancel={handleCancelSave}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
      >
        <Form form={saveForm} layout="vertical">
          <Form.Item
            label="表单 Key"
            field="key"
            rules={[
              { required: true, message: "请输入表单 key" },
              { match: /^[a-z][a-z0-9_]*$/, message: "key 只能包含小写字母、数字和下划线，且必须以字母开头" },
            ]}
            extra="唯一标识，如：hr_leave_request"
          >
            <Input placeholder="如：hr_leave_request" />
          </Form.Item>
          <Form.Item
            label="表单名称"
            field="name"
            rules={[{ required: true, message: "请输入表单名称" }]}
          >
            <Input placeholder="如：请假申请单" />
          </Form.Item>
          <Form.Item label="表单描述" field="description">
            <Input.TextArea placeholder="请输入描述" autoSize={{ minRows: 2, maxRows: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

