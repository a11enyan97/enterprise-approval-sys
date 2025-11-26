# 用户状态管理说明

## 当前状态（开发测试阶段）

**注意**：目前用户信息是写死在 store 中的，用于开发测试。登录功能实现后，需要移除测试数据。

### 默认测试用户

系统初始化时会自动使用以下测试用户：

- **申请者（applicant）**：
  - ID: 1
  - 用户名: applicant001
  - 姓名: 张三
  - 角色: applicant

- **审批者（approver）**：
  - ID: 2
  - 用户名: approver001
  - 姓名: 李四
  - 角色: approver

## 使用方式

### 1. 获取用户信息（业务模块使用）

```typescript
import { useUserStore } from "@/store/userStore";

const { user, isApplicant, isApprover } = useUserStore();

// 检查用户角色
if (isApplicant()) {
  // 申请者逻辑
}

if (isApprover()) {
  // 审批者逻辑
}
```

### 2. 切换测试角色（用于测试）

```typescript
import { useUserStore } from "@/store/userStore";

const { switchToApplicant, switchToApprover } = useUserStore();

// 切换到申请者角色
switchToApplicant();

// 切换到审批者角色
switchToApprover();
```

### 3. 手动设置用户信息（登录后使用）

```typescript
import { useUserStore } from "@/store/userStore";

const { setUser } = useUserStore();

// 在登录成功后设置用户信息
setUser({
  id: 1,
  username: "zhangsan",
  realName: "张三",
  role: "applicant", // 或 "approver"
  primaryDeptId: 1,
});
```

### 4. 清除用户信息

```typescript
import { useUserStore } from "@/store/userStore";

const { clearUser } = useUserStore();

// 登出时清除（会重置为默认申请者）
clearUser();
```

## 数据持久化

用户信息会自动保存到 localStorage，页面刷新后仍然有效。

## 角色权限说明

- **applicant（申请者）**：
  - 可以新建审批申请
  - 可以修改和提交自己创建的草稿状态申请
  - 可以查看所有申请

- **approver（审批者）**：
  - 可以审批 pending 状态的申请（同意/拒绝）
  - 可以查看所有申请
  - 不能新建或修改申请

## 在审批列表页切换角色

在审批列表页的右上角，有一个用户头像下拉菜单，可以快速切换测试角色，方便测试不同角色的功能。

