# Server Actions API 文档

> 最后更新：2025-12-08  
> 本文档基于 Next.js App Router 的 Server Actions 架构

## 📖 概述

本项目使用 **Server Actions** 替代传统的 REST API。Server Actions 是 Next.js 13+ 提供的服务端函数，可以直接在客户端组件中调用，无需手动处理 HTTP 请求。

### 优势

- ✅ **类型安全**：TypeScript 自动推断参数和返回值类型
- ✅ **无需手动序列化**：Next.js 自动处理数据序列化
- ✅ **简化调用**：直接导入函数调用，无需 fetch/axios
- ✅ **更好的开发体验**：IDE 自动补全和类型检查

### 调用方式

```typescript
// ✅ 正确：在 Client Component 中直接调用
"use client";
import { createApprovalAction } from "@/actions/approval.action";

const handleSubmit = async () => {
  const result = await createApprovalAction({
    projectName: "项目名称",
    // ... 其他参数
  });
  
  if (result.success) {
    console.log(result.data);
  } else {
    console.error(result.error);
  }
};
```

## 📦 响应格式

所有 Server Actions 统一返回以下格式：

```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

### 成功响应示例

```typescript
{
  success: true,
  data: { /* 具体数据 */ }
}
```

### 失败响应示例

```typescript
{
  success: false,
  error: "错误信息",
  code: "ERROR_CODE" // 可选
}
```

## 🔧 审批相关 Actions

### 1. 创建审批申请

**函数签名：**
```typescript
createApprovalAction(params: CreateApprovalRequestInput): Promise<ActionResult<ApprovalRequestItem>>
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `projectName` | `string` | ✅ | 审批项目名称 |
| `approvalContent` | `string` | ❌ | 审批内容（≤300字） |
| `deptId` | `number \| string \| null` | ❌ | 部门ID |
| `executeDate` | `string \| Date` | ✅ | 执行日期（ISO 8601 格式） |
| `applicantId` | `number` | ✅ | 申请人ID |
| `attachments` | `AttachmentInput[]` | ❌ | 附件列表 |

**使用示例：**

```typescript
import { createApprovalAction } from "@/actions/approval.action";

const result = await createApprovalAction({
  projectName: "AI 服务器采购",
  approvalContent: "需要采购 10 台 GPU 服务器",
  deptId: 3, // 部门ID
  executeDate: new Date().toISOString(),
  applicantId: 1,
  attachments: [
    {
      filePath: "https://oss.example.com/file.xlsx",
      fileName: "预算表.xlsx",
      attachmentType: "table",
      fileSize: 102400,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
  ]
});

if (result.success) {
  console.log("创建成功:", result.data);
} else {
  console.error("创建失败:", result.error);
}
```

**返回数据：**
- 成功：返回创建的 `ApprovalRequestItem` 对象（包含自动生成的 `requestNo`）
- 失败：返回错误信息和错误码

---

### 2. 获取审批申请列表

**函数签名：**
```typescript
getApprovalListAction(params?: GetApprovalListParams): Promise<ActionResult<ApprovalRequestListResponse>>
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | ❌ | 页码（默认：1） |
| `pageSize` | `number` | ❌ | 每页数量（默认：10） |
| `applicantId` | `number` | ❌ | 按申请人ID过滤 |
| `status` | `ApprovalStatus \| string` | ❌ | 按状态过滤 |
| `deptId` | `number` | ❌ | 按部门ID过滤（会查询该部门及其子部门） |
| `projectName` | `string` | ❌ | 项目名称（模糊查询） |
| `createTimeStart` | `string` | ❌ | 创建时间开始（ISO 8601） |
| `createTimeEnd` | `string` | ❌ | 创建时间结束（ISO 8601） |
| `approvalTimeStart` | `string` | ❌ | 审批时间开始（ISO 8601） |
| `approvalTimeEnd` | `string` | ❌ | 审批时间结束（ISO 8601） |

**使用示例：**

```typescript
import { getApprovalListAction } from "@/actions/approval.action";
import { ApprovalStatus } from "@/types/approval";

const result = await getApprovalListAction({
  page: 1,
  pageSize: 10,
  status: ApprovalStatus.PENDING,
  deptId: 2
});

if (result.success) {
  console.log("列表数据:", result.data.data);
  console.log("总数:", result.data.total);
  console.log("总页数:", result.data.totalPages);
}
```

**返回数据：**
```typescript
{
  success: true,
  data: {
    data: ApprovalRequestItem[], // 列表数据
    total: number,               // 总记录数
    page: number,                // 当前页码
    pageSize: number,            // 每页数量
    totalPages: number           // 总页数
  }
}
```

---

### 3. 获取审批申请详情

**函数签名：**
```typescript
getApprovalDetailAction(requestId: string): Promise<ActionResult<ApprovalRequestItem>>
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `requestId` | `string` | ✅ | 审批申请ID（BigInt 转字符串） |

**使用示例：**

```typescript
import { getApprovalDetailAction } from "@/actions/approval.action";

const result = await getApprovalDetailAction("123");

if (result.success) {
  console.log("详情数据:", result.data);
} else if (result.code === "NOT_FOUND") {
  console.error("审批申请不存在");
}
```

**错误码：**
- `NOT_FOUND`: 审批申请不存在

---

### 4. 获取表单配置

**函数签名：**
```typescript
getApprovalFormSchemaAction(formKey: string): Promise<ActionResult<FormSchema>>
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `formKey` | `string` | ✅ | 表单配置键名（如：`"approval.create"`） |

**使用示例：**

```typescript
import { getApprovalFormSchemaAction } from "@/actions/approval.action";

const result = await getApprovalFormSchemaAction("approval.create");

if (result.success) {
  const schema = result.data;
  console.log("表单标题:", schema.title);
  console.log("表单字段:", schema.fields);
  // 使用 schema 动态渲染表单
} else {
  console.error("获取失败:", result.error);
}
```

**返回数据：**
```typescript
{
  success: true,
  data: {
    key: "approval.create",
    title: "新建审批单",
    description: "依据表单配置动态渲染审批单表单",
    layout: {
      labelCol: { span: 2 },
      wrapperCol: { span: 8 }
    },
    fields: [
      {
        key: "projectName",
        label: "审批项目",
        type: "input",
        required: true,
        placeholder: "请输入审批项目",
        rules: [{ required: true, message: "请输入审批项目" }]
      },
      {
        key: "applicationDepartment",
        label: "申请部门",
        type: "treeSelect",
        required: true,
        placeholder: "请选择申请部门",
        rules: [{ required: true, message: "请选择申请部门" }]
      },
      {
        key: "approvalContent",
        label: "审批内容",
        type: "textarea",
        required: true,
        placeholder: "请输入审批内容，限制300字内",
        rules: [
          { required: true, message: "请输入审批内容" },
          { maxLength: 300, message: "审批内容不能超过300字" }
        ],
        componentProps: {
          maxLength: 300,
          showWordLimit: true,
          autoSize: { minRows: 4, maxRows: 8 }
        }
      },
      {
        key: "executionDate",
        label: "执行日期",
        type: "date",
        required: true,
        placeholder: "请选择执行日期",
        rules: [{ required: true, message: "请选择执行日期" }],
        componentProps: {
          format: "YYYY-MM-DD"
        }
      },
      {
        key: "imageAttachments",
        label: "图片附件",
        type: "uploadImage",
        componentProps: {
          multiple: true,
          imagePreview: true,
          limit: 3,
          listType: "picture-card"
        }
      },
      {
        key: "tableAttachments",
        label: "表格附件",
        type: "uploadTable",
        componentProps: {
          accept: ".xlsx,.xls"
        }
      }
    ]
  }
}
```

**字段类型说明：**

| 类型 | 说明 | 适用场景 |
| --- | --- | --- |
| `input` | 单行文本输入 | 项目名称、标题等 |
| `textarea` | 多行文本输入 | 审批内容、描述等 |
| `date` | 日期选择器 | 执行日期、截止日期等 |
| `treeSelect` | 树形选择器 | 部门选择、分类选择等 |
| `uploadImage` | 图片上传 | 图片附件 |
| `uploadTable` | 文件上传 | Excel 表格附件 |

**错误码：**
- `FORM_SCHEMA_NOT_FOUND`: 表单配置不存在

**业务说明：**
- 表单配置采用声明式 Schema，支持动态渲染表单
- 前端根据 Schema 自动生成表单字段和校验规则
- 配置统一管理在 `constants/form-schemas.ts`，便于维护和扩展

---

### 5. 提交/更新审批申请（编辑草稿）

**函数签名：**
```typescript
submitApprovalAction(requestId: string, data: SubmitApprovalRequestInput): Promise<ActionResult<ApprovalRequestItem>>
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `requestId` | `string` | ✅ | 审批申请ID |
| `data` | `SubmitApprovalRequestInput` | ✅ | 更新数据（见下方说明） |

**`SubmitApprovalRequestInput` 字段：**

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `projectName` | `string` | 审批项目名称 |
| `approvalContent` | `string` | 审批内容 |
| `deptId` | `number \| null` | 部门ID |
| `executeDate` | `string \| Date` | 执行日期 |
| `currentStatus` | `"draft" \| "pending"` | 状态（`pending` 表示提交） |
| `attachments` | `AttachmentInput[]` | 附件列表 |

**使用示例：**

```typescript
import { submitApprovalAction } from "@/actions/approval.action";

// 编辑草稿
const editResult = await submitApprovalAction("123", {
  projectName: "更新后的项目名称",
  approvalContent: "更新后的内容"
});

// 提交草稿
const submitResult = await submitApprovalAction("123", {
  currentStatus: "pending"
});
```

**业务规则：**
- 只有 `draft` 状态的申请可以编辑
- 提交时设置 `currentStatus: "pending"`，系统会自动写入 `submittedAt`

---

### 6. 审批操作（同意/拒绝）

**函数签名：**
```typescript
approveOrRejectAction(
  requestId: string,
  action: "approve" | "reject",
  approverId: number
): Promise<ActionResult<ApprovalRequestItem>>
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `requestId` | `string` | ✅ | 审批申请ID |
| `action` | `"approve" \| "reject"` | ✅ | 审批动作 |
| `approverId` | `number` | ✅ | 审批人ID |

**使用示例：**

```typescript
import { approveOrRejectAction } from "@/actions/approval.action";

// 同意
const approveResult = await approveOrRejectAction("123", "approve", 1);

// 拒绝
const rejectResult = await approveOrRejectAction("123", "reject", 1);
```

**业务规则：**
- 只有 `pending` 状态的申请可以审批
- 系统会自动更新 `currentStatus` 为 `approved` 或 `rejected`
- 系统会自动写入 `completedAt`

**错误码：**
- `INVALID_ACTION`: action 参数无效
- `MISSING_PARAMETER`: 缺少必要参数

---

### 7. 删除审批申请

**函数签名：**
```typescript
deleteApprovalAction(requestId: string): Promise<ActionResult<ApprovalRequestItem>>
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `requestId` | `string` | ✅ | 审批申请ID |

**使用示例：**

```typescript
import { deleteApprovalAction } from "@/actions/approval.action";

const result = await deleteApprovalAction("123");

if (result.success) {
  console.log("删除成功，被删除的记录:", result.data);
}
```

**说明：**
- 删除操作会同时删除关联的附件（事务处理）
- 返回被删除记录的快照，便于前端做回显提醒

---

## 🏢 部门相关 Actions

### 获取部门列表

**函数签名：**
```typescript
getDepartmentsAction(format?: "cascader" | "list"): Promise<ActionResult<CascaderOption[] | Department[]>>
```

**参数说明：**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `format` | `"cascader" \| "list"` | ❌ | `"cascader"` | 返回格式 |

**使用示例：**

```typescript
import { getDepartmentsAction } from "@/actions/departments.action";

// 获取级联格式（用于 TreeSelect）
const cascaderResult = await getDepartmentsAction("cascader");
if (cascaderResult.success) {
  // result.data 是 CascaderOption[] 格式
  console.log(cascaderResult.data);
}

// 获取完整列表
const listResult = await getDepartmentsAction("list");
if (listResult.success) {
  // result.data 是 Department[] 格式
  console.log(listResult.data);
}
```

**返回格式说明：**

- `cascader`: 返回 `{ title, key, children }[]` 格式，用于 Arco Design 的 TreeSelect
- `list`: 返回完整的部门对象数组，包含 `level`、`sortOrder` 等字段

**业务规则：**
- 仅返回 `status = 1` 的启用部门
- 结果已按 `level`、`sortOrder`、`id` 排序

---

## 📁 文件相关 Actions

### 1. 获取 OSS 上传签名

**函数签名：**
```typescript
getOSSTokenAction(
  filename: string,
  contentType?: string
): Promise<OSSTokenResponse>
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `filename` | `string` | ✅ | 文件名 |
| `contentType` | `string` | ❌ | 文件 MIME 类型 |

**使用示例：**

```typescript
import { getOSSTokenAction } from "@/actions/oss.action";

const result = await getOSSTokenAction(
  "example.xlsx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
);

if (result.success) {
  console.log("上传URL:", result.uploadUrl);
  console.log("公开URL:", result.publicUrl);
  console.log("文件名:", result.filename);
}
```

**返回数据：**
```typescript
{
  success: true,
  uploadUrl: string,    // 预签名上传URL
  publicUrl: string,     // 公开访问URL
  filename: string       // OSS中的文件名
}
```

---

### 2. 校验 Excel 文件

**函数签名：**
```typescript
validateExcelAction(formData: FormData): Promise<ExcelValidationResponse>
```

**参数说明：**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `formData` | `FormData` | ✅ | 包含 `file` 字段的 FormData |

**使用示例：**

```typescript
import { validateExcelAction } from "@/actions/excel.action";

const formData = new FormData();
formData.append("file", file); // file 是 File 对象

const result = await validateExcelAction(formData);

if (result.success) {
  console.log("校验通过，数据:", result.data);
} else {
  console.error("校验失败:", result.error);
  if (result.errors) {
    // 详细的错误信息
    result.errors.forEach(err => {
      console.error(`第 ${err.row} 行 ${err.field}: ${err.message}`);
    });
  }
}
```

**返回数据：**

成功：
```typescript
{
  success: true,
  data: any[] // 解析后的Excel数据
}
```

失败：
```typescript
{
  success: false,
  error: string, // 错误信息
  errors?: Array<{
    row: number;      // 错误行号
    field?: string;   // 错误字段
    message: string;  // 错误消息
  }>
}
```

**校验规则：**
- 文件类型必须是 `.xlsx` 或 `.xls`
- 文件大小限制：10MB
- 必需表头字段：`项目名称`、`申请部门`、`执行日期`
- 可选表头字段：`审批内容`

---

## 📝 类型定义

所有类型定义在 `types/` 目录下：

- `types/approval.ts`: 审批相关类型
- `types/departments.ts`: 部门相关类型
- `types/oss.ts`: OSS 相关类型

### 常用类型

```typescript
// 审批状态
enum ApprovalStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

// 附件输入
interface AttachmentInput {
  filePath: string;
  fileName: string;
  attachmentType: 'image' | 'table';
  fileSize?: number | string;
  mimeType?: string | null;
}

// 审批申请项
interface ApprovalRequestItem {
  id: string;
  requestNo: string;
  projectName: string;
  approvalContent?: string;
  // ... 更多字段
}
```

---

## 💡 最佳实践

### 1. 错误处理

```typescript
const result = await createApprovalAction(params);

if (!result.success) {
  // 统一错误处理
  Message.error(result.error);
  
  // 根据错误码做不同处理
  if (result.code === "VALIDATION_ERROR") {
    // 处理验证错误
  }
  return;
}

// 成功处理
Message.success("操作成功");
```

### 2. 类型安全

```typescript
import type { CreateApprovalRequestInput } from "@/types/approval";

// TypeScript 会自动检查参数类型
const params: CreateApprovalRequestInput = {
  projectName: "项目名称",
  // IDE 会提示所有可用字段
};
```

### 3. 在 Server Component 中使用

```typescript
// app/approval/page.tsx (Server Component)
import { getApprovalListAction } from "@/actions/approval.action";

export default async function ApprovalPage() {
  // 在 Server Component 中可以直接调用
  const result = await getApprovalListAction({ page: 1, pageSize: 10 });
  
  if (!result.success) {
    // 处理错误
    return <div>加载失败: {result.error}</div>;
  }
  
  return <ApprovalTableClient initialData={result.data} />;
}
```

### 4. 在 Client Component 中使用

```typescript
"use client";
import { createApprovalAction } from "@/actions/approval.action";
import { Message } from "@arco-design/web-react";

export default function ApprovalForm() {
  const handleSubmit = async (values: any) => {
    const result = await createApprovalAction(values);
    
    if (result.success) {
      Message.success("创建成功");
      router.push('/approval');
    } else {
      Message.error(result.error);
    }
  };
  
  // ...
}
```

---

## 🔍 调试技巧

### 1. 查看函数签名

在 IDE 中，将鼠标悬停在函数名上，可以看到完整的类型定义：

```typescript
// 悬停在 createApprovalAction 上
createApprovalAction(params: CreateApprovalRequestInput): Promise<ActionResult<ApprovalRequestItem>>
```

### 2. 使用 TypeScript 类型检查

```typescript
// TypeScript 会在编译时检查类型
const result = await createApprovalAction({
  projectName: "项目", // ✅ 正确
  // invalidField: "value" // ❌ TypeScript 会报错
});
```

### 3. 查看源码

所有 Server Actions 都在 `actions/` 目录下：
- `actions/approval.action.ts` - 审批相关
- `actions/departments.action.ts` - 部门相关
- `actions/oss.action.ts` - OSS 相关
- `actions/excel.action.ts` - Excel 校验

---

## 📚 相关文档

- [项目架构说明](./项目架构说明.md) - 了解整体架构设计
- [Next.js Server Actions 官方文档](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

---

## ❓ 常见问题

### Q: Server Actions 和 API Routes 有什么区别？

A: Server Actions 是 Next.js 13+ 的新特性，可以直接在客户端调用服务端函数，无需手动处理 HTTP 请求。API Routes 是传统的 REST API 端点。

### Q: 可以在 Server Component 中调用 Server Actions 吗？

A: 可以，但通常 Server Component 直接调用 Service 层更合适。Server Actions 主要用于 Client Component 中的用户交互。

### Q: 如何传递文件到 Server Action？

A: 使用 `FormData`：

```typescript
const formData = new FormData();
formData.append("file", file);
const result = await validateExcelAction(formData);
```

### Q: Server Actions 支持流式响应吗？

A: 不支持。Server Actions 只能返回序列化的数据。如果需要流式响应，需要使用 API Routes。

---

**维护者**: 颜博骏

