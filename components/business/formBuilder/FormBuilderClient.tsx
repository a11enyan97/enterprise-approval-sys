"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Space, Tag, Typography } from "@arco-design/web-react";
import { DndContext, DragOverlay, PointerSensor, closestCenter, useSensor, useSensors, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import type { FieldType, FormField } from "@/types/formBuilder";
import { useFormBuilderStore } from "@/store/useFormBuilderStore";
import PropertyPanel from "@/components/business/formBuilder/PropertyPanel";
import Canvas from "@/components/business/formBuilder/Canvas";
import PaletteItem, { paletteItems } from "@/components/business/formBuilder/PaletteItem";

const { Title, Paragraph } = Typography;

export default function FormBuilderClient() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveField(null);
    setActiveOverlayWidth(undefined);
    if (!over) return;

    const overId = String(over.id);
    const overSource = over.data?.current?.source;
    const activeSource = active.data?.current?.source;
    if (activeSource === "palette") {
      const type = active.data?.current?.fieldType as FieldType;
      // 只有当落点在画布或画布内的字段上时才新增
      if (overSource === "canvas") {
        addField(type, overId !== "canvas" ? overId : undefined);
      }
      return;
    }

    if (active.id !== over.id) {
      moveField(String(active.id), overId);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeSource = active.data?.current?.source;
    if (activeSource === "canvas") {
      const found = fields.find((item) => item._id === active.id);
      setActiveField(found || null);
      const el = typeof document !== "undefined"
        ? (document.querySelector(`[data-dnd-id="${active.id}"]`) as HTMLElement | null)
        : null;
      const width = el?.getBoundingClientRect().width;
      setActiveOverlayWidth(width);
    } else {
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
            <Button type="primary" onClick={() => navigator.clipboard?.writeText(JSON.stringify(schema, null, 2))}>
              复制 JSON
            </Button>
          </Space>
        </div>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
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

        <DragOverlay dropAnimation={null}>
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
    </div>
  );
}

