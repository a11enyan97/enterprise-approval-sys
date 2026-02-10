"use client";

/**
 * 画布区域：显示表单字段卡片，支持拖拽排序与删除
 * 按需订阅 store（仅 fields / selectedId / selectField / removeField），
 * 改表单标题、Schema 预览等不会触发画布重渲染；无需再靠 React.memo 挡兄弟更新
 */

import { memo } from "react";
import { Empty } from "@arco-design/web-react";
import { type UniqueIdentifier, useDroppable } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useFormBuilderStore } from "@/store/useFormBuilderStore";
import SortableFieldCard from "@/components/business/formBuilder/SortableFieldCard";

function CanvasPlaceholder() {
  return (
    <div className="flex h-60 flex-col items-center justify-center text-sm text-gray-400">
      <Empty description="将左侧组件拖拽到这里" style={{ margin: 0 }} />
    </div>
  );
}

function CanvasInner() {
  const fields = useFormBuilderStore((state) => state.schema.fields);
  const selectedId = useFormBuilderStore((state) => state.selectedFieldId);
  const selectField = useFormBuilderStore((state) => state.selectField);
  const removeField = useFormBuilderStore((state) => state.removeField);

  const { setNodeRef, isOver } = useDroppable({ id: "canvas", data: { source: "canvas" } });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[420px] rounded-lg border bg-gray-50 p-4 ${isOver ? "border-blue-500 bg-blue-50" : "border-dashed border-gray-200"}`}
    >
      <SortableContext items={fields.map((f) => f._id as UniqueIdentifier)}>
        {fields.length === 0 && <CanvasPlaceholder />}
        {fields.map((field) => (
          <SortableFieldCard
            key={field._id}
            field={field}
            isSelected={selectedId === field._id}
            onSelect={selectField}
            onDelete={removeField}
          />
        ))}
      </SortableContext>
    </div>
  );
}

export default memo(CanvasInner);
