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

## Docker（一份配置：本地开发 + 线上部署）

同一份 `docker-compose.yml` 支持两种用法：

- **本地开发**：只启动 PostgreSQL 容器，本机跑 `npm run dev`，用 `.env` 连 `127.0.0.1:5432`。
- **全栈/部署**：`docker compose up -d` 启动 PostgreSQL + Next 应用，访问 http://localhost:3000。

### 前置条件
- 已安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/)（Windows/Mac）

### 1. 准备环境变量
```bash
cp .env.example .env
```
按需修改 `.env`（数据库密码、OSS 等）。本地开发与 Docker 全栈都读这份 `.env`；应用在容器内运行时，compose 会把数据库主机改为 `db`，无需改 `.env`。

---

### 方式一：本地开发（本机跑 Next，Docker 只跑 PostgreSQL）

1. **只启动数据库**
   ```bash
   docker compose up -d db
   ```
   等待约 10 秒（健康检查通过）。PostgreSQL 映射到宿主机 **5432** 端口。

2. **确认 `.env` 指向本机 PostgreSQL**
   ```env
   DATABASE_HOST=127.0.0.1
   DATABASE_PORT=5432
   DATABASE_URL="postgresql://postgres:1234@127.0.0.1:5432/approvalsys"
   ```
   （与 `.env.example` 一致即可。）

3. **本机安装依赖并启动**
   ```bash
   npm install
   npx prisma migrate deploy   # 首次或迁移有变更时执行一次
   npm run dev
   ```
   访问 http://localhost:3000。

---

### 方式二：全栈运行 / 部署（应用也跑在 Docker 里）

1. **构建并启动所有服务**
   ```bash
   docker compose up -d --build
   ```
   首次会构建 Next 镜像并拉取 PostgreSQL，约 1～2 分钟。应用启动时会自动执行 `prisma migrate deploy`。

2. **访问**  
   浏览器打开 http://localhost:3000。数据库在容器内通过服务名 `db:5432` 连接，宿主机仍可通过 **5432** 端口连 PostgreSQL（如用 GUI 工具）。

---

### 常用命令
```bash
docker compose up -d db        # 仅启动 PostgreSQL（本地开发）
docker compose up -d --build   # 启动 PostgreSQL + 应用（全栈/部署）
docker compose down            # 停止并删除容器（数据卷 postgres_data 保留）
docker compose logs -f app     # 查看应用日志
docker compose logs -f db      # 查看数据库日志
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
