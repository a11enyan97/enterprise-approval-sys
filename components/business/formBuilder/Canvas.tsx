"use client";

/** 
 * 画布区域：显示表单字段卡片，支持拖拽排序与删除
 */

import { memo } from "react";
import { Empty } from "@arco-design/web-react";
import { type UniqueIdentifier, useDroppable } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import SortableFieldCard from "@/components/business/formBuilder/SortableFieldCard";
import { useFormBuilderStore } from "@/store/useFormBuilderStore";
import { useShallow } from "zustand/react/shallow";

function CanvasPlaceholder() {
  return (
    <div className="flex h-60 flex-col items-center justify-center text-sm text-gray-400">
      <Empty description="将左侧组件拖拽到这里" style={{ margin: 0 }} />
    </div>
  );
}

export default memo(function Canvas({
  onSelectAction,
  onDeleteAction,
  selectedId,
}: {
  onSelectAction: (id: string) => void;
  onDeleteAction: (id: string) => void;
  selectedId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas", data: { source: "canvas" } });

  // 性能优化：只订阅 fields 的 ID 列表
  // 使用 useShallow 确保只有当 ID 数组的内容发生变化（增删移动）时，才会触发重渲染
  const fieldIds = useFormBuilderStore(
    useShallow((state) => state.schema.fields.map((f) => f._id))
  );

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[420px] rounded-lg border bg-gray-50 p-4 ${isOver ? "border-blue-500 bg-blue-50" : "border-dashed border-gray-200"}`}
    >
      <SortableContext items={fieldIds as UniqueIdentifier[]}>
        {fieldIds.length === 0 && <CanvasPlaceholder />}
        {fieldIds.map((id) => (
          <SortableFieldCard
            key={id}
            id={id as string}
            isSelected={selectedId === id}
            onSelect={onSelectAction}
            onDelete={onDeleteAction}
          />
        ))}
      </SortableContext>
    </div>
  );
});
