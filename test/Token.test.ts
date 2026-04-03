import { Client } from "../src/Client";
import { cleanStorage, makeClient, it_api } from "./utils/Helpers";
import {
  TokenPermissions,
  Token,
  TokenCreateRequest,
} from "../src/messages/Token";

const describe_token = () =>
  process.env.RS_API_TOKEN !== undefined && process.env.RS_API_TOKEN.length > 0
    ? describe
    : describe.skip;

describe_token()("With Token API Client", () => {
  const client: Client = makeClient();
  beforeEach(async () => {
    await cleanStorage(client);
    await client.createBucket("bucket_1");
    await client.createBucket("bucket_2");
  });

  it("should create a token", async () => {
    const permissions: TokenPermissions = {
      fullAccess: true,
      read: ["bucket_1"],
      write: ["bucket_2"],
    };
    const token = await client.createToken("token-1", permissions);
    expect(token).toContain("token-1-");

    const tokenInfo: Token = await client.getToken("token-1");
    expect(tokenInfo.name).toEqual("token-1");
    expect(tokenInfo.permissions).toEqual(permissions);
    expect(tokenInfo.createdAt).toBeLessThanOrEqual(Date.now());
  });

  it("should list tokens", async () => {
    let tokens = await client.getTokenList();
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({
      name: "init-token",
      createdAt: expect.any(Number),
      // isProvisioned: true, TODO: uncomment in next release
    });

    await client.createToken("token-1", { fullAccess: true });
    await client.createToken("token-2", { fullAccess: false });

    tokens = await client.getTokenList();
    expect(tokens).toHaveLength(3);
    expect(tokens[0]).toMatchObject({
      name: "init-token",
    });
    expect(tokens[1]).toMatchObject({
      name: "token-1",
      isProvisioned: false,
    });
    expect(tokens[2]).toMatchObject({
      name: "token-2",
      isProvisioned: false,
    });
  });

  it("should delete a token", async () => {
    await client.createToken("token-1", { fullAccess: true });
    await client.deleteToken("token-1");

    expect(await client.getTokenList()).toMatchObject([{ name: "init-token" }]);
  });

  it("should provide current API token and its permissions", async () => {
    const token: Token = await client.me();
    expect(token.name).toEqual("init-token");
    expect(token.permissions).toEqual({
      fullAccess: true,
      read: [],
      write: [],
    });
  });

  it_api("1.19")("should create token with ttl and ip allowlist", async () => {
    const now = Date.now();
    const request: TokenCreateRequest = {
      permissions: {
        fullAccess: false,
        read: ["bucket_1"],
        write: ["bucket_2"],
      },
      ttl: 120000,
      expiresAt: now + 120000,
      ipAllowlist: ["127.0.0.1", "10.0.0.0/8"],
    };

    const token = await client.createToken("token-ttl", request);
    expect(token).toContain("token-ttl-");

    const tokenInfo = await client.getToken("token-ttl");
    expect(tokenInfo.permissions).toEqual(request.permissions);
    expect(tokenInfo.ttl).toEqual(120000);
    expect(tokenInfo.expiresAt).toBeDefined();
    expect(tokenInfo.ipAllowlist).toEqual(["127.0.0.1", "10.0.0.0/8"]);
    expect(tokenInfo.isExpired).toBe(false);
  });

  it_api("1.19")("should rotate token", async () => {
    const original = await client.createToken("token-rot", {
      fullAccess: true,
    });

    const rotated = await client.rotateToken("token-rot");
    expect(rotated).toContain("token-rot-");
    expect(rotated).not.toEqual(original);

    const rotatedClient = new Client("http://127.0.0.1:8383", {
      apiToken: rotated,
      timeout: 10000,
    });

    const me = await rotatedClient.me();
    expect(me.name).toEqual("token-rot");
  });
});
