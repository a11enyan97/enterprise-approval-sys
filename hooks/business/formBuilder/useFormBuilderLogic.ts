import { useState, useMemo, useEffect } from "react";
import { Form, Message } from "@arco-design/web-react";
import { PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from "@dnd-kit/core";
import { useFormBuilderStore } from "@/store/useFormBuilderStore";
import { useUserStore } from "@/store/useUserStore";
import { createFormTemplateAction } from "@/actions/form.action";
import { paletteItems } from "@/components/business/formBuilder/PaletteItem";
import { showSuccessMessage } from "@/utils/approvalUtils";
import type { FormFieldType, FormField } from "@/types/formBuilder";

export function useFormBuilderLogic() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
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
  const [message, contextHolder] = Message.useMessage();
  const selectedField = useMemo(() => fields.find((item: FormField) => item._id === selectedFieldId), [fields, selectedFieldId]);
  
  const [activeField, setActiveField] = useState<FormField | null>(null);
  const [activeOverlayWidth, setActiveOverlayWidth] = useState<number | undefined>(undefined);
  
  const user = useUserStore((state) => state.user);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveForm] = Form.useForm();
  const [metaForm] = Form.useForm();

  // 同步表单元数据
  useEffect(() => {
    metaForm.setFieldsValue({
      title: schema.title,
      description: schema.description,
    });
  }, [schema.title, schema.description, metaForm]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeSource = active.data?.current?.source;
    if (activeSource === "canvas") {
      const found = fields.find((item: FormField) => item._id === active.id);
      setActiveField(found || null);
      const el = typeof document !== "undefined"
        ? (document.querySelector(`[data-dnd-id="${active.id}"]`) as HTMLElement | null)
        : null;
      const width = el?.getBoundingClientRect().width;
      setActiveOverlayWidth(width);
    } else {
      const type = active.data?.current?.fieldType as FormFieldType | undefined;
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveField(null);
    setActiveOverlayWidth(undefined);
    
    if (!over) return;

    const overId = String(over.id);
    const activeSource = active.data?.current?.source;
    
    if (activeSource === "palette") {
      const type = active.data?.current?.fieldType as FormFieldType;
      const isCanvasContainer = overId === "canvas";
      
      if (isCanvasContainer) {
        addField(type, overId);
      }
      return;
    }

    if (active.id !== over.id) {
      moveField(String(active.id), overId);
    }
  };

  const handlePropertyChange = (patch: any) => {
    if (!selectedField) return;
    updateField(selectedField._id as string, patch);
  };

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
      const result = await createFormTemplateAction({
        key: values.key,
        name: values.name,
        description: values.description,
        schema: schema,
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

  return {
    state: {
      sensors,
      schema,
      fields,
      selectedFieldId,
      selectedField,
      activeField,
      activeOverlayWidth,
      contextHolder,
      metaForm,
      saveForm,
      saveModalVisible,
      saving,
    },
    methods: {
      reset,
      setSaveModalVisible,
      updateMeta,
      selectField,
      removeField,
      handleDragStart,
      handleDragEnd,
      handlePropertyChange,
      handleSave,
      handleConfirmSave,
    }
  };
}

