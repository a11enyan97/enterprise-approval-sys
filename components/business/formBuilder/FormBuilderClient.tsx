"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Space, Tag, Typography, Message, Modal } from "@arco-design/web-react";
import { DndContext, DragOverlay, PointerSensor, pointerWithin, useSensor, useSensors, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import type { FieldType, FormField } from "@/types/formBuilder";
import { useFormBuilderStore } from "@/store/useFormBuilderStore";
import { useUserStore } from "@/store/userStore";
import { createFormTemplateAction } from "@/actions/form.action";
import PropertyPanel from "@/components/business/formBuilder/PropertyPanel";
import Canvas from "@/components/business/formBuilder/Canvas";
import PaletteItem, { paletteItems } from "@/components/business/formBuilder/PaletteItem";

const { Title, Paragraph } = Typography;

export default function FormBuilderClient() {
  const sensors = useSensors(
    // 鼠标传感器：拖拽距离≥4px才激活，避免误触
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    // 键盘传感器：支持方向键拖拽排序
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Zustand 全局状态与动作
  const schema = useFormBuilderStore((state) => state.schema);
  const selectedFieldId = useFormBuilderStore((state) => state.selectedFieldId);
  const addField = useFormBuilderStore((state) => state.addField);
  const moveField = useFormBuilderStore((state) => state.moveField);
  const selectField = useFormBuilderStore((state) => state.selectField);
  const updateField = useFormBuilderStore((state) => state.updateField);
  const removeField = useFormBuilderStore((state) => state.removeField);
  const updateMeta = useFormBuilderStore((state) => state.updateMeta);
  const reset = useFormBuilderStore((state) => state.reset);

  const fields = schema.fields;
  const selectedField = useMemo(() => fields.find((item) => item._id === selectedFieldId), [fields, selectedFieldId]);
  const [activeField, setActiveField] = useState<FormField | null>(null);
  const [activeOverlayWidth, setActiveOverlayWidth] = useState<number | undefined>(undefined);
  
  // 保存相关状态
  const { user } = useUserStore();
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveForm] = Form.useForm();

  // 拖拽开始：记录拖拽影子；画布内保持原宽度，Palette 使用模板预览
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeSource = active.data?.current?.source;
    if (activeSource === "canvas") {
      // 画布的渲染影子容器
      const found = fields.find((item) => item._id === active.id);
      setActiveField(found || null);
      const el = typeof document !== "undefined"
        ? (document.querySelector(`[data-dnd-id="${active.id}"]`) as HTMLElement | null)
        : null;
      const width = el?.getBoundingClientRect().width;
      setActiveOverlayWidth(width);
    } else {
      // Palette 的渲染影子容器
      const type = active.data?.current?.fieldType as FieldType | undefined;
      if (type) {
        const template = paletteItems.find((item) => item.type === type);
        setActiveField({
          _id: "preview",
          key: `${type}-preview`,
          type,
          label: template?.title || "新字段",
          required: false,
          placeholder: template?.desc || "",
          props: {},
          rules: [],
        });
        setActiveOverlayWidth(undefined);
      } else {
        setActiveField(null);
        setActiveOverlayWidth(undefined);
      }
    }
  };

  // 拖拽结束：Palette -> 画布新增；画布内部排序
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveField(null);
    setActiveOverlayWidth(undefined);
    
    // 如果没有落点，直接返回（拖到画布外）
    if (!over) return;

    const overId = String(over.id);
    const activeSource = active.data?.current?.source;
    
    if (activeSource === "palette") {
      const type = active.data?.current?.fieldType as FieldType;
      const isCanvasContainer = overId === "canvas";
      
      if (isCanvasContainer) {
        addField(type, overId);
      }
      return;
    }

    // 画布内部排序：只有当拖到不同位置时才移动
    if (active.id !== over.id) {
      moveField(String(active.id), overId);
    }
  };

  // 右侧属性面板回调：部分更新字段
  const handlePropertyChange = (patch: any) => {
    if (!selectedField) return;
    updateField(selectedField._id, patch);
  };

  const [metaForm] = Form.useForm();

  useEffect(() => {
    metaForm.setFieldsValue({
      title: schema.title,
      description: schema.description,
    });
  }, [schema.title, schema.description, metaForm]);

  // 保存表单模板
  const handleSave = async () => {
    if (!user) {
      Message.error("请先登录");
      return;
    }

    if (fields.length === 0) {
      Message.warning("请至少添加一个字段");
      return;
    }

    setSaveModalVisible(true);
    // 初始化保存表单：使用 schema 的 title 作为默认 name，生成默认 key
    saveForm.setFieldsValue({
      key: schema.title ? `form_${schema.title.toLowerCase().replace(/\s+/g, "_")}` : "",
      name: schema.title || "未命名表单",
      description: schema.description || "",
    });
  };

  // 确认保存
  const handleConfirmSave = async () => {
    try {
      const values = await saveForm.validate();
      if (!values.key || !values.name) {
        Message.error("请填写表单 key 和名称");
        return;
      }

      setSaving(true);
      const result = await createFormTemplateAction({
        key: values.key,
        name: values.name,
        description: values.description,
        schema: schema,
        createdBy: user.id,
        isPublished: false, // 默认不发布
      });

      if (!result.success) {
        throw new Error("error" in result ? result.error : "保存失败");
      }

      Message.success("保存成功");
      setSaveModalVisible(false);
      saveForm.resetFields();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "保存失败";
      Message.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
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
        onDragCancel={() => setActiveField(null)}
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
                fields={fields}
                onSelectAction={(id) => selectField(id)}
                onDeleteAction={(id) => removeField(id)}
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

