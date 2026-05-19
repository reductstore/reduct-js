/**
 * LifecycleType string literal type for TypeScript type checking.
 */
export type LifecycleType = "delete";

/**
 * LifecycleType namespace providing constant values for runtime usage.
 */
export namespace LifecycleType {
  export const DELETE: LifecycleType = "delete";
}

export const DEFAULT_LIFECYCLE_TYPE: LifecycleType = "delete";

export const parseLifecycleType = (type?: string): LifecycleType => {
  if (type === "delete") {
    return type;
  }

  return DEFAULT_LIFECYCLE_TYPE;
};
