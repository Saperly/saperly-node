/** Convert a camelCase string to snake_case. */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
}

/** Convert a snake_case string to camelCase. */
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
}

/** Recursively convert all object keys from camelCase to snake_case. */
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  return transformKeys(obj, camelToSnake) as Record<string, unknown>;
}

/** Recursively convert all object keys from snake_case to camelCase. */
export function toCamelCase<T>(obj: unknown): T {
  return transformKeys(obj, snakeToCamel) as T;
}

function transformKeys(value: unknown, fn: (key: string) => string): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => transformKeys(item, fn));
  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[fn(key)] = transformKeys(val, fn);
    }
    return result;
  }
  return value;
}
