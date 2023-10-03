/**
 * Token Permissions with server-side names
 */
class OriginalTokenPermission {
    full_access = false;
    read?: string[] = [];
    write?: string[] = [];
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
            write: data.write
        };
    }

    static serialize(data: TokenPermissions): OriginalTokenPermission {
        return {
            full_access: data.fullAccess,
            read: data.read,
            write: data.write
        };
    }
}

/**
 * Token Info with server-side names
 */
class OriginalTokenInfo {
    name = "";
    created_at = "";
    is_provisioned = false;
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
     * Is the token provisioned, and you can't remove it or change it
     */
    readonly isProvisioned: boolean = false;

    /**
     * Permissions of the token
     */
    readonly permissions?: TokenPermissions;

    static parse(data: OriginalTokenInfo): Token {
        return {
            name: data.name,
            createdAt: Date.parse(data.created_at),
            isProvisioned: data.is_provisioned,
            permissions: data.permissions ? TokenPermissions.parse(data.permissions) : undefined
        };
    }
}
