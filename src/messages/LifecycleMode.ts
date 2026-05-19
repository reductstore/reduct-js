/**
 * LifecycleMode string literal type for TypeScript type checking.
 */
export type LifecycleMode = "enabled" | "disabled" | "dry_run";

/**
 * LifecycleMode namespace providing constant values for runtime usage.
 */
export namespace LifecycleMode {
  export const ENABLED = "enabled";
  export const DISABLED = "disabled";
  export const DRY_RUN = "dry_run";
}

export const DEFAULT_LIFECYCLE_MODE: LifecycleMode = "enabled";

export const parseLifecycleMode = (mode?: string): LifecycleMode => {
  if (mode === "enabled" || mode === "disabled" || mode === "dry_run") {
    return mode;
  }

  return DEFAULT_LIFECYCLE_MODE;
};
