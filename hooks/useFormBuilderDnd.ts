import { useFormBuilderStore } from "@/store/useFormBuilderStore";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type { FormField, FormFieldType } from "@/types/formBuilder";
import { getFormBuilderState } from "@/store/useFormBuilderStore";
import { FIELD_TYPE_META } from "@/lib/agent/schemas";
import { useState } from "react";
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

/**
 * 拖拽相关逻辑
 * 
 * @returns sensors 传感器
 * @returns activeField 当前拖拽的字段
 * @returns activeOverlayWidth 当前拖拽的字段的宽度
 * @returns handleDragStart 拖拽开始回调
 * @returns handleDragEnd 拖拽结束回调
 * @returns handleDragCancel 拖拽取消回调
 */
export default function useFormBuilderDnd() {
    // 创建传感器
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    const [activeField, setActiveField] = useState<FormField | null>(null);
    const [activeOverlayWidth, setActiveOverlayWidth] = useState<number | undefined>(undefined);
    const addField = useFormBuilderStore((state) => state.addField);
    const moveField = useFormBuilderStore((state) => state.moveField);

    // 拖拽开始：记录拖拽影子；画布内保持原宽度，Palette 使用模板预览（回调中取数，不订阅 schema）
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const activeSource = active.data?.current?.source;
        const fields = getFormBuilderState().schema.fields;
        if (activeSource === "canvas") {
            const found = fields.find((item: FormField) => item._id === active.id);
            setActiveField(found || null);
            const el = typeof document !== "undefined"
                ? (document.querySelector(`[data-dnd-id="${active.id}"]`) as HTMLElement | null)
                : null;
            const width = el?.getBoundingClientRect().width;
            setActiveOverlayWidth(width);
        } else {
            // Palette 的渲染影子容器
            const type = active.data?.current?.fieldType as FormFieldType | undefined;
            if (type) {
                const meta = FIELD_TYPE_META[type];
                setActiveField({
                    _id: "preview",
                    key: `${type}-preview`,
                    type,
                    label: meta?.label || "新字段",
                    required: false,
                    placeholder: meta?.description || "",
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
            const type = active.data?.current?.fieldType as FormFieldType;
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

    const handleDragCancel = () => {
        setActiveField(null);
        setActiveOverlayWidth(undefined);
    };
    return {
        sensors,
        activeField,
        activeOverlayWidth,
        handleDragStart,
        handleDragEnd,
        handleDragCancel,
    };
}