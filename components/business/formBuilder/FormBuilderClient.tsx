"use client";

import { Button, Card, Form, Input, Space, Tag, Typography, Modal } from "@arco-design/web-react";
import { DndContext, DragOverlay, pointerWithin } from "@dnd-kit/core";
import PropertyPanel from "@/components/business/formBuilder/PropertyPanel";
import Canvas from "@/components/business/formBuilder/Canvas";
import PaletteItem, { paletteItems } from "@/components/business/formBuilder/PaletteItem";
import { useFormBuilderLogic } from "@/hooks/business/formBuilder/useFormBuilderLogic";

const { Title, Paragraph } = Typography;

export default function FormBuilderClient() {
  const { state, methods } = useFormBuilderLogic();
  
  const { 
    sensors, schema, fields, selectedFieldId, selectedField, 
    activeField, activeOverlayWidth, contextHolder, metaForm, 
    saveForm, saveModalVisible, saving 
  } = state;

  const { 
    reset, setSaveModalVisible, updateMeta, selectField, 
    removeField, handleDragStart, handleDragEnd, handlePropertyChange, 
    handleSave, handleConfirmSave 
  } = methods;

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
            <Button onClick={() => navigator.clipboard?.writeText(JSON.stringify(schema, null, 2))}>
              复制 JSON
            </Button>
            <Button type="primary" onClick={handleSave} disabled={fields.length === 0}>
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
        onDragCancel={() => methods.handleDragEnd({ active: { id: '' } as any, over: null } as any)} // Hack to clear active
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
              <Canvas
                onSelectAction={selectField}
                onDeleteAction={removeField}
                selectedId={selectedFieldId}
              />
            </Card>
          </div>

          <div className="md:col-span-3 space-y-3">
            <Card size="small" title="表单信息">
              <Form
                layout="vertical"
                form={metaForm}
                onValuesChange={(_, values) => updateMeta(values)}
              >
                <Form.Item label="表单标题" field="title" rules={[{ required: true, message: "请输入表单标题" }]}>
                  <Input placeholder="如：审批单" />
                </Form.Item>
                <Form.Item label="表单描述" field="description">
                  <Input.TextArea placeholder="请输入描述" autoSize={{ minRows: 2, maxRows: 4 }} />
                </Form.Item>
              </Form>
            </Card>

            <PropertyPanel field={selectedField} onChange={handlePropertyChange} />

            <Card size="small" title="Schema 预览">
              <pre className="max-h-80 overflow-auto rounded bg-gray-900 p-3 text-xs text-green-200">
                {JSON.stringify(schema, null, 2)}
              </pre>
            </Card>
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
        onCancel={() => {
          setSaveModalVisible(false);
          saveForm.resetFields();
        }}
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
