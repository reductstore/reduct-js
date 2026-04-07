/**
 * Token Permissions with server-side names
 */
export class OriginalTokenPermission {
  full_access = false;
  read?: string[] = [];
  write?: string[] = [];
}

/**
 * Token create request with server-side names
 */
export class OriginalTokenCreateRequest {
  permissions: OriginalTokenPermission = new OriginalTokenPermission();
  expires_at?: string;
  ttl?: number;
  ip_allowlist?: string[];
}

/**
 * Token create request
 */
export class TokenCreateRequest {
  /**
   * Permissions for the token
   */
  readonly permissions: TokenPermissions = new TokenPermissions();

  /**
   * Expiration time as unix timestamp in milliseconds
   */
  readonly expiresAt?: number;

  /**
   * Time to live in seconds
   */
  readonly ttl?: number;

  /**
   * List of IP addresses and CIDR ranges allowed to use the token
   */
  readonly ipAllowlist?: string[];

  static serialize(data: TokenCreateRequest): OriginalTokenCreateRequest {
    return {
      permissions: TokenPermissions.serialize(data.permissions),
      expires_at:
        data.expiresAt !== undefined
          ? new Date(data.expiresAt).toISOString()
          : undefined,
      ttl: data.ttl,
      ip_allowlist: data.ipAllowlist,
    };
  }
}

/**
 * Token Permissions
 */
export class TokenPermissions {
  /**
   * Full access
   * The token allows to create, remove and update settings of buckets, manage tokens and read and write data.
   */
  readonly fullAccess: boolean = false;

  /**
   * Read access
   * List of buckets allowed to read
   */
  readonly read?: string[] = [];

  /**
   * Write access
   * List of buckets allowed to write
   */
  readonly write?: string[] = [];

  static parse(data: OriginalTokenPermission): TokenPermissions {
    return {
      fullAccess: data.full_access,
      read: data.read,
      write: data.write,
    };
  }

  static serialize(data: TokenPermissions): OriginalTokenPermission {
    return {
      full_access: data.fullAccess,
      read: data.read,
      write: data.write,
    };
  }
}

/**
 * Token Info with server-side names
 */
export class OriginalTokenInfo {
  name = "";
  created_at = "";
  last_access?: string;
  ttl?: number;
  is_expired?: boolean;
  expires_at?: string;
  ip_allowlist?: string[];
  is_provisioned? = false;
  permissions?: OriginalTokenPermission = undefined;
}

/**
 * Information about an access token
 */
export class Token {
  /**
   * Name of the token
   */
  readonly name: string = "";

  /**
   * Creation time of the token as unix timestamp in milliseconds
   */
  readonly createdAt: number = 0;

  /**
   * Last access time of the token as unix timestamp in milliseconds
   */
  readonly lastAccess?: number;

  /**
   * Time to live in seconds
   */
  readonly ttl?: number;

  /**
   * True if the token is expired
   */
  readonly isExpired?: boolean;

  /**
   * Expiration time as unix timestamp in milliseconds
   */
  readonly expiresAt?: number;

  /**
   * List of IP addresses and CIDR ranges allowed to use the token
   */
  readonly ipAllowlist?: string[];

  /**
   * Is the token provisioned, and you can't remove it or change it
   */
  readonly isProvisioned?: boolean = false;

  /**
   * Permissions of the token
   */
  readonly permissions?: TokenPermissions;

  static parse(data: OriginalTokenInfo): Token {
    return {
      name: data.name,
      createdAt: Date.parse(data.created_at),
      lastAccess: data.last_access ? Date.parse(data.last_access) : undefined,
      ttl: data.ttl,
      isExpired: data.is_expired,
      expiresAt: data.expires_at ? Date.parse(data.expires_at) : undefined,
      ipAllowlist: data.ip_allowlist,
      isProvisioned: data.is_provisioned ?? false,
      permissions: data.permissions
        ? TokenPermissions.parse(data.permissions)
        : undefined,
    };
  }
}
