"use client";

import { Empty } from "@arco-design/web-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import type { FormField } from "@/types/formBuilder";
import SortableFieldCard from "@/components/business/formBuilder/SortableFieldCard";

function CanvasPlaceholder() {
  return (
    <div className="flex h-60 flex-col items-center justify-center text-sm text-gray-400">
      <Empty description="将左侧组件拖拽到这里" style={{ margin: 0 }} />
    </div>
  );
}

export default function Canvas({
  fields,
  onSelectAction,
  onDeleteAction,
  selectedId,
}: {
  fields: FormField[];
  onSelectAction: (id: string) => void;
  onDeleteAction: (id: string) => void;
  selectedId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas", data: { source: "canvas" } });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[420px] rounded-lg border bg-gray-50 p-4 ${isOver ? "border-blue-500 bg-blue-50" : "border-dashed border-gray-200"}`}
    >
      <SortableContext items={fields.map((f) => f._id)}>
        {fields.length === 0 && <CanvasPlaceholder />}
        {fields.map((field) => (
          <SortableFieldCard
            key={field._id}
            field={field}
            isSelected={selectedId === field._id}
            onSelect={onSelectAction}
            onDelete={onDeleteAction}
          />
        ))}
      </SortableContext>
    </div>
  );
}

