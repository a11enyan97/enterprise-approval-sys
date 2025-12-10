# 企业审批系统（Enterprise Approval System）

基于 **Next.js 16 App Router** 的全栈审批系统，使用 Server Components / Server Actions + Prisma。支持动态表单、OSS 直传、Excel 校验、图片压缩上传等能力。

## 核心特性
- 动态表单：`constants/form-schemas.ts` + `FormFieldRenderer` 自动渲染。
- 审批流程：草稿/提交/审批/拒绝，附件管理。
- 文件上传：OSS 预签名直传，Excel 校验（含 GBK 兼容）。
- 图片压缩：`utils/imageCompressor.ts` 上传前自动压缩至 ≤1MB、最长边 1920 像素。

## 本地运行
### 环境要求
- Node.js 18+（推荐 20）
- MySQL 数据库可用实例

### 安装依赖
```bash
npm install
# 或 pnpm install / yarn install / bun install
```

### 配置环境变量（.env.local）
```env
# 数据库（Prisma 使用）
DATABASE_URL="mysql://user:password@localhost:3306/your_db"

# OSS 配置
OSS_REGION=your_region           # 如 cn-hangzhou
OSS_ACCESS_KEY_ID=your_key
OSS_ACCESS_KEY_SECRET=your_secret
OSS_BUCKET=your_bucket
```

### 数据库准备
- 已有迁移：运行 `npx prisma migrate deploy`（或在开发环境使用 `npx prisma migrate dev`）
- 如需生成 Prisma Client：`npx prisma generate`（通常在 postinstall 已自动执行）

### 启动开发服务器
```bash
npm run dev
# 默认端口 http://localhost:3000
```

### 生产构建与启动
```bash
npm run build
npm start   # 使用 .env.local 中的配置
```

## 关键路径
- 前端入口：`app/approval`（列表、详情/编辑）
- 组件：`components/business/approval/*`
- Server Actions：`actions/*.action.ts`
- 服务层：`services/*`（含 excel-validator、form-config、oss）
- 工具：`utils/`（含图片压缩、上传、格式化等）

## 图片上传压缩说明
- 上传图片前自动调用 `compressImage`（1MB / 1920px，使用 WebWorker）。
- 压缩失败自动回退原文件，确保上传流程不中断。
