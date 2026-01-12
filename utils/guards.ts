
import type { UserInfo } from "@/store/useUserStore";
import type { OSSTokenResponse } from "@/types/oss";

/**
 * 检查值是否为 File 对象
 */
export function isFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * 检查值是否为 UserInfo 对象
 */
export function isUserInfo(value: unknown): value is UserInfo {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const user = value as Partial<UserInfo>;

  return (
    typeof user.id === "number" &&
    typeof user.username === "string" &&
    typeof user.realName === "string" &&
    (user.role === "applicant" || user.role === "approver")
  );
}

/**
 * 检查 OSS Token 响应是否成功
 */
export function isOSSTokenSuccess(
  response: OSSTokenResponse
): response is Extract<OSSTokenResponse, { success: true }> {
  return response.success === true;
}
