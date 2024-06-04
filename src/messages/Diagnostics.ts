class DiagnosticsErrorOriginal {
  count = 0;
  last_message = "";
}

/**
 * Diagnostics error
 */
export class DiagnosticsError {
  /**
   * Number of errors
   */
  readonly count: number = 0;

  /**
   * Last error message
   */
  readonly lastMessage: string = "";

  static parse(data: DiagnosticsErrorOriginal): DiagnosticsError {
    return {
      count: data.count,
      lastMessage: data.last_message,
    };
  }
}

class OrigianlDiagnosticsItem {
  ok = 0n;
  errored = 0n;
  errors: { [key: number]: DiagnosticsErrorOriginal } = {};
}

/**
 * Diagnostics item
 */
export class DiagnosticsItem {
  /**
   * Number of successful operations
   */
  readonly ok: bigint = 0n;

  /**
   * Number of failed operations
   */
  readonly errored: bigint = 0n;

  /**
   * Errors
   */
  readonly errors: { [key: number]: DiagnosticsError } = {};

  static parse(data: OrigianlDiagnosticsItem): DiagnosticsItem {
    return {
      ok: BigInt(data.ok),
      errored: BigInt(data.errored),
      errors: Object.fromEntries(
        Object.entries(data.errors).map(([key, value]) => [
          Number(key),
          DiagnosticsError.parse(value),
        ]),
      ),
    };
  }
}

export class OriginalDiagnostics {
  hourly = new OrigianlDiagnosticsItem();
}

/**
 * Diagnostics
 */
export class Diagnostics {
  /**
   * Hourly diagnostics
   */
  readonly hourly: DiagnosticsItem = new DiagnosticsItem();

  static parse(data: OriginalDiagnostics): Diagnostics {
    return {
      hourly: DiagnosticsItem.parse(data.hourly),
    };
  }
}
