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
  if (status === Status.DELETING) {
    return Status.DELETING;
  }
  if (status === Status.READY) {
    return Status.READY;
  }
  // Default to READY for undefined or unknown values
  return Status.READY;
}
