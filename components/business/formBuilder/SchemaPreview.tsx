"use client";

/**
 * Schema 预览：仅订阅 schema，改画布/属性面板等不会触发重渲染
 */

import { Card } from "@arco-design/web-react";
import { useFormBuilderStore } from "@/store/useFormBuilderStore";

export default function SchemaPreview() {
  const schema = useFormBuilderStore((state) => state.schema);

  return (
    <Card size="small" title="Schema 预览">
      <pre className="max-h-80 overflow-auto rounded bg-gray-900 p-3 text-xs text-green-200">
        {JSON.stringify(schema, null, 2)}
      </pre>
    </Card>
  );
}
