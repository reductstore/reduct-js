import {Client} from "../src/Client";
import {cleanStorage, makeClient} from "./Helpers";
import {TokenPermissions, Token} from "../src/Token";

const describe_token = () =>
    process.env.RS_API_TOKEN !== undefined && process.env.RS_API_TOKEN.length > 0
        ? describe : describe.skip;

describe_token()("With Token API Client", () => {
    const client: Client = makeClient();
    beforeEach((done) => {
        cleanStorage(client)
            .then(() => client.createBucket("bucket_1"))
            .then(() => client.createBucket("bucket_2"))
            .then(() => done());
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
            isProvisioned: false,
        });

        await client.createToken("token-1", {fullAccess: true});
        await client.createToken("token-2", {fullAccess: false});

        tokens = await client.getTokenList();
        expect(tokens).toHaveLength(3);
        expect(tokens[0]).toMatchObject({
            name: "init-token",
        });
        expect(tokens[1]).toMatchObject({
            name: "token-1",
            isProvisioned: false,
            permissions: {fullAccess: true, read: [], write: []},
        });
        expect(tokens[2]).toMatchObject({
            name: "token-2",
            isProvisioned: false,
            permissions: {fullAccess: false, read: [], write: []},
        });

    });

    it("should delete a token", async () => {
        await client.createToken("token-1", {fullAccess: true});
        await client.deleteToken("token-1");

        expect(await client.getTokenList()).toMatchObject([
            {name: "init-token"}
        ]);
    });

    it("should provide current API token and its permissions", async () => {
        const token: Token = await client.me();
        expect(token.name).toEqual("init-token");
        expect(token.permissions).toEqual({fullAccess: true, read: [], write: []});
    });
});
