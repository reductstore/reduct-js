import {
  OriginalReplicationSettings,
  ReplicationSettings,
} from "./ReplicationSettings";
import { Diagnostics, OriginalDiagnostics } from "./Diagnostics";

/**
 * Original Replication Info
 */
class OriginalReplicationInfo {
  name = "";
  is_active = false;
  is_provisioned = false;
  pending_records = 0n;
}

/**
 * Replication info
 */
export class ReplicationInfo {
  /**
   * Replication name
   */
  readonly name: string = "";

  /**
   * Remote instance is available and replication is active
   */
  readonly isActive: boolean = false;

  /**
   * Replication is provisioned
   */
  readonly isProvisioned: boolean = false;

  /**
   * Number of records pending replication
   */
  readonly pendingRecords: bigint = 0n;

  static parse(data: OriginalReplicationInfo): ReplicationInfo {
    return {
      name: data.name,
      isActive: data.is_active,
      isProvisioned: data.is_provisioned,
      pendingRecords: BigInt(data.pending_records),
    };
  }
}

/**
 * Replication full info
 */
export class FullReplicationInfo {
  /**
   * Replication info
   */
  readonly info: ReplicationInfo = new ReplicationInfo();

  /**
   * Replication settings
   */
  readonly settings: ReplicationSettings = new ReplicationSettings();

  /**
   * Replication statistics
   */
  readonly diagnostics: Diagnostics = new Diagnostics();

  static parse(data: {
    info: OriginalReplicationInfo;
    settings: OriginalReplicationSettings;
    diagnostics: OriginalDiagnostics;
  }): FullReplicationInfo {
    return {
      info: ReplicationInfo.parse(data.info),
      settings: ReplicationSettings.parse(data.settings),
      diagnostics: Diagnostics.parse(data.diagnostics),
    };
  }
}
