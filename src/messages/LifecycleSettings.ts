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
  older_than = "";
  interval?: string;
  processing_interval?: string;
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
  readonly olderThan: string = "";

  /**
   * Interval between lifecycle runs, e.g. "10m", "1h", or "3600s".
   */
  readonly interval?: string;

  /**
   * Maximum data-time span processed by one lifecycle run, e.g. "6h", "12h", or "1d".
   */
  readonly processingInterval?: string;

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
      olderThan: data.older_than,
      interval: data.interval,
      processingInterval: data.processing_interval,
      when: data.when,
      mode: parseLifecycleMode(data.mode),
    };
  }

  static serialize(data: LifecycleSettings): OriginalLifecycleSettings {
    return {
      type: data.lifecycleType ?? DEFAULT_LIFECYCLE_TYPE,
      bucket: data.bucket,
      entries: data.entries,
      older_than: data.olderThan,
      interval: data.interval,
      processing_interval: data.processingInterval,
      when: data.when,
      mode: data.mode ?? DEFAULT_LIFECYCLE_MODE,
    };
  }
}
