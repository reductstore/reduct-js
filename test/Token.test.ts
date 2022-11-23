import {Client} from "../src/Client";
import {cleanStorage, makeClient} from "./Helpers";
import {TokenPermissions, Token} from "../src/Token";

describe("With Token API Client", () => {
    const client: Client = makeClient();
    beforeEach((done) => {
        cleanStorage(client).then(() => done());
    });

    test("should create a token", async () => {
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

    test("should list tokens", async () => {
        expect(await client.getTokenList()).toEqual([
            {name: "init-token", createdAt: expect.any(Number)}
        ]);
        await client.createToken("token-1", {fullAccess: true});
        await client.createToken("token-2", {fullAccess: false});
        expect(await client.getTokenList()).toEqual([
            {name: "init-token", createdAt: expect.any(Number)},
            {name: "token-1", createdAt: expect.any(Number)},
            {name: "token-2", createdAt: expect.any(Number)}
        ]);
    });

    test("should delete a token", async () => {
        await client.createToken("token-1", {fullAccess: true});
        await client.deleteToken("token-1");

        expect(await client.getTokenList()).toEqual([
            {name: "init-token", createdAt: expect.any(Number)}
        ]);
    });
});
