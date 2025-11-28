/**
 * 将对象中的 BigInt 和 Date 字段转换为可序列化的格式
 * @param obj 需要转换的对象
 * @returns 转换后的对象
 */
export function serialize<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // 处理 BigInt
  if (typeof obj === "bigint") {
    return obj.toString();
  }

  // 处理 Date 对象
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(serialize);
  }

  // 处理普通对象
  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serialize((obj as any)[key]);
      }
    }
    return result;
  }

  return obj;
}

