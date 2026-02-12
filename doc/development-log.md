# 动态表单生成 Agent 开发记录

> 边开发边记录，便于复盘与面试梳理。

---

## 一、Zod 在 Agent 工具中的使用

### 1. 为什么用 Zod？

- **DynamicTool 的局限**：`DynamicTool` 的 `func` 入参为 `string`，仅靠 `description` 引导 LLM，易因幻觉导致格式错误（如 JSON 解析失败）。
- **DynamicStructuredTool + Zod**：使用 Zod schema 约束入参，在调用前做校验，降低 LLM 幻觉导致的调用失败。

### 2. 使用位置

| 文件 | 用途 |
|------|------|
| `lib/agent/tools/pg-query.ts` | SQL 查询入参校验 |
| `lib/agent/tools/http-request.ts` | HTTP 请求入参校验 |

### 3. pg_query 工具 Schema

```ts
const pgQueryInputSchema = z
  .object({
    query: z.string().min(1, "query 不能为空"),
  })
  .refine((v) => v.query.trim().toUpperCase().startsWith("SELECT"), {
    message: "仅支持 SELECT 查询，禁止 INSERT/UPDATE/DELETE 等写操作",
  });
```

- `z.object` + `z.string().min(1)`：query 必填、非空
- `refine`：仅允许 SELECT，防止写操作

### 4. http_request 工具 Schema

```ts
const httpRequestInputSchema = z.object({
  url: z.url({ message: "url 必须是合法 URL" }),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  data: z.record(z.string(), z.unknown()).optional(),
});
```

- `z.url()`：Zod v4 中 url 校验的用法（`z.string().url()` 已弃用）
- `z.enum`：限制 method 为合法 HTTP 方法
- `z.record(z.string(), z.unknown())`：可选请求体，Zod v4 需显式指定 key/value 类型

### 5. Zod v4 注意事项

- **url 校验**：使用 `z.url({ message: "..." })`，不再使用 `z.string().url()`
- **record 类型**：`z.record(z.string(), z.unknown())` 需两个参数（key schema, value schema）

---

## 二、Zod 原理与面试常考点

### 1. 核心原理

| 概念 | 说明 |
|------|------|
| **Schema 即类型** | Zod schema 描述数据结构，`.parse()` 校验运行时数据，`z.infer<typeof schema>` 推导 TypeScript 类型，实现「一份定义，类型 + 校验双用」 |
| **链式构建** | 每个 schema 是 immutable 的，`.optional()`、`.refine()` 等返回新 schema，支持链式组合 |
| **解析流程** | `parse()` → 遍历 schema 树 → 校验/转换 → 成功返回解析值，失败抛 `ZodError` |
| **early return** | 校验失败立即抛错，不继续后续字段（可在 `schema.shape` 层面控制） |

### 2. parse vs safeParse

```ts
// parse：失败抛 ZodError
const data = schema.parse(input);

// safeParse：失败返回 { success: false, error }
const result = schema.safeParse(input);
if (result.success) {
  result.data; // 解析后的值
} else {
  result.error; // ZodError
}
```

面试答：`parse` 适合「校验失败即终止」的场景；`safeParse` 适合需要程序化处理错误、不中断流程的场景。

### 3. 常见 API 速记

| API | 作用 |
|-----|------|
| `z.object()` | 对象结构 |
| `z.string()` `.min()` `.max()` `.url()` | 字符串约束 |
| `z.number()` `.int()` `.positive()` | 数字约束 |
| `z.enum([...])` | 枚举字面量 |
| `z.array()` | 数组 |
| `z.union()` / `z.discriminatedUnion()` | 联合类型 |
| `z.refine()` / `z.superRefine()` | 自定义校验，可跨字段 |
| `z.transform()` | 解析后转换值 |
| `z.infer<typeof schema>` | 从 schema 推导 TS 类型 |

### 4. 面试常考点

- **Zod 和 TypeScript 的关系**：TypeScript 只做编译时类型检查，运行时无效；Zod 在运行时校验，可配合 `z.infer` 保证类型与校验一致。
- **Zod 和 JSON Schema 的转换**：`zodToJsonSchema` 可将 Zod schema 转为 JSON Schema，用于 OpenAPI、LLM 工具声明等。
- **refine 和 superRefine 的区别**：`refine` 返回 boolean 或对象（含 message）；`superRefine` 可多次调用 `ctx.addIssue()`，支持更细粒度的错误和路径。
- **性能考虑**：复杂 schema 解析有开销，高频路径可缓存解析结果或抽离热点校验。
- **与 class-validator 的对比**：Zod 声明式、不可变、类型推导强；class-validator 基于装饰器，偏 OOP，需配合 reflect-metadata。

### 5. 一句话总结

> Zod 是 TypeScript 优先的运行时 schema 校验库，通过 schema 定义同时获得类型推导和运行时校验，常用于 API 入参、表单、配置文件及 LLM 工具入参的校验。

---

## 三、待补充

- [ ] Agent 核心编排逻辑
- [ ] 动态表单生成 Prompt 设计
- [ ] 与 FormSchema 的对接方式
