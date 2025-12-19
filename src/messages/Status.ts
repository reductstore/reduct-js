/**
 * Resource status during deletion
 */
export enum Status {
  READY = "READY",
  DELETING = "DELETING",
}

/**
 * Parse status string and return a valid Status enum value.
 * Defaults to READY for undefined or invalid values.
 */
export function parseStatus(status?: string): Status {
  if (status === "DELETING") {
    return Status.DELETING;
  }
  return Status.READY;
}
