-- 插入两条用户数据：申请人、审批人（PostgreSQL）
-- 密码均为 password（bcrypt 哈希）。本项目当前通过 Cookie 切换角色，不校验密码

INSERT INTO users (username, password_hash, role, real_name, primary_dept_id, status, created_at, updated_at)
VALUES
  ('applicant', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'applicant', '申请人', NULL, 1, NOW(), NOW()),
  ('approver', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'approver', '审批人', NULL, 1, NOW(), NOW())
ON CONFLICT (username) DO NOTHING;
