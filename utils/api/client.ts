/**
 * API 客户端基础配置
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: string;
}

/**
 * 通用 API 请求函数
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `请求失败: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error("API 请求错误:", error);
    throw error;
  }
}

/**
 * GET 请求
 */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<ApiResponse<T>> {
  let url = endpoint;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  return apiRequest<T>(url, {
    method: "GET",
  });
}

/**
 * POST 请求
 */
export async function apiPost<T>(
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT 请求
 */
export async function apiPut<T>(
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH 请求
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE 请求
 */
export async function apiDelete<T>(
  endpoint: string
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "DELETE",
  });
}

