/**
 * LifecycleType string literal type for TypeScript type checking.
 */
export type LifecycleType = "delete" | "compress";

/**
 * LifecycleType namespace providing constant values for runtime usage.
 */
export namespace LifecycleType {
  export const DELETE: LifecycleType = "delete";
  export const COMPRESS: LifecycleType = "compress";
}

export const DEFAULT_LIFECYCLE_TYPE: LifecycleType = "delete";

export const parseLifecycleType = (type?: string): LifecycleType => {
  if (type === "delete" || type === "compress") {
    return type;
  }

  return DEFAULT_LIFECYCLE_TYPE;
};
