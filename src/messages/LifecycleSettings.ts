import {
  DEFAULT_LIFECYCLE_MODE,
  LifecycleMode,
  parseLifecycleMode,
} from "./LifecycleMode";
import {
  DEFAULT_LIFECYCLE_TYPE,
  LifecycleType,
  parseLifecycleType,
} from "./LifecycleType";

export class OriginalLifecycleSettings {
  type?: LifecycleType;
  bucket = "";
  entries: string[] = [];
  max_age = "";
  interval?: string;
  when?: any;
  mode?: LifecycleMode;
}

/**
 * Lifecycle settings.
 */
export class LifecycleSettings {
  /**
   * Lifecycle action type.
   */
  readonly lifecycleType?: LifecycleType;

  /**
   * Bucket to apply lifecycle policy.
   */
  readonly bucket: string = "";

  /**
   * List of entries to process. If empty, all matching entries are processed.
   */
  readonly entries: string[] = [];

  /**
   * Maximum record age, e.g. "30d", "24h", or "3600s".
   */
  readonly maxAge: string = "";

  /**
   * Interval between lifecycle runs, e.g. "10m", "1h", or "3600s".
   */
  readonly interval?: string;

  /**
   * Conditional query.
   */
  readonly when?: any;

  /**
   * Lifecycle mode.
   */
  readonly mode?: LifecycleMode;

  static parse(data: OriginalLifecycleSettings): LifecycleSettings {
    return {
      lifecycleType: parseLifecycleType(data.type),
      bucket: data.bucket,
      entries: data.entries,
      maxAge: data.max_age,
      interval: data.interval,
      when: data.when,
      mode: parseLifecycleMode(data.mode),
    };
  }

  static serialize(data: LifecycleSettings): OriginalLifecycleSettings {
    return {
      type: data.lifecycleType ?? DEFAULT_LIFECYCLE_TYPE,
      bucket: data.bucket,
      entries: data.entries,
      max_age: data.maxAge,
      interval: data.interval,
      when: data.when,
      mode: data.mode ?? DEFAULT_LIFECYCLE_MODE,
    };
  }
}
