import {
  LifecycleMode,
  DEFAULT_LIFECYCLE_MODE,
  parseLifecycleMode,
} from "./LifecycleMode";
import {
  LifecycleType,
  DEFAULT_LIFECYCLE_TYPE,
  parseLifecycleType,
} from "./LifecycleType";
import {
  LifecycleSettings,
  OriginalLifecycleSettings,
} from "./LifecycleSettings";

/**
 * Original lifecycle info.
 */
export class OriginalLifecycleInfo {
  name = "";
  mode: LifecycleMode = DEFAULT_LIFECYCLE_MODE;
  is_provisioned = false;
  is_running = false;
  type: LifecycleType = DEFAULT_LIFECYCLE_TYPE;
  last_run?: string;
}

/**
 * Lifecycle info.
 */
export class LifecycleInfo {
  /**
   * Lifecycle policy name.
   */
  readonly name: string = "";

  /**
   * Lifecycle mode.
   */
  readonly mode: LifecycleMode = DEFAULT_LIFECYCLE_MODE;

  /**
   * Lifecycle action type.
   */
  readonly type: LifecycleType = DEFAULT_LIFECYCLE_TYPE;

  /**
   * Last lifecycle run time.
   */
  readonly lastRun?: Date;

  /**
   * Lifecycle policy is provisioned.
   */
  readonly isProvisioned: boolean = false;

  /**
   * Lifecycle worker is running.
   */
  readonly isRunning: boolean = false;

  static parse(data: OriginalLifecycleInfo): LifecycleInfo {
    return {
      name: data.name,
      mode: parseLifecycleMode(data.mode),
      type: parseLifecycleType(data.type),
      lastRun: data.last_run ? new Date(data.last_run) : undefined,
      isProvisioned: data.is_provisioned,
      isRunning: data.is_running,
    };
  }
}

/**
 * Lifecycle full info.
 */
export class FullLifecycleInfo {
  /**
   * Lifecycle info.
   */
  readonly info: LifecycleInfo = new LifecycleInfo();

  /**
   * Lifecycle settings.
   */
  readonly settings: LifecycleSettings = new LifecycleSettings();

  static parse(data: FullLifecycleInfoResponse): FullLifecycleInfo {
    return {
      info: LifecycleInfo.parse(data.info),
      settings: LifecycleSettings.parse(data.settings),
    };
  }
}

export interface FullLifecycleInfoResponse {
  info: OriginalLifecycleInfo;
  settings: OriginalLifecycleSettings;
}
